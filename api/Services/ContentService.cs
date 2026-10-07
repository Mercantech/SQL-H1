using System.Text.Json;
using Markdig;
using Microsoft.Extensions.Options;
using SqlH1.Api.Models;
using SqlH1.Api.Options;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace SqlH1.Api.Services;

public class ContentService
{
    private readonly string _root;
    private readonly MarkdownPipeline _pipeline;
    private readonly IDeserializer _yaml;
    private List<ModuleCatalogItem>? _modules;
    private Dictionary<string, ContentItem>? _items;
    private DateTime _loadedAtUtc = DateTime.MinValue;
    private readonly object _lock = new();

    public ContentService(IOptions<ContentOptions> options)
    {
        _root = Path.GetFullPath(options.Value.RootPath);
        _pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
        _yaml = new DeserializerBuilder()
            .WithNamingConvention(CamelCaseNamingConvention.Instance)
            .IgnoreUnmatchedProperties()
            .Build();
    }

    public IReadOnlyList<ModuleCatalogItem> GetModules()
    {
        EnsureLoaded();
        return _modules!;
    }

    public ContentItem? GetContent(string slug)
    {
        EnsureLoaded();
        return _items!.TryGetValue(slug, out var item) ? item : null;
    }

    public IReadOnlyList<ContentItem> GetModuleContents(string moduleSlug)
    {
        EnsureLoaded();
        return _items!.Values
            .Where(x => x.Module.Equals(moduleSlug, StringComparison.OrdinalIgnoreCase))
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Slug)
            .ToList();
    }

    public string? ResolveSeedPath(ContentItem item)
    {
        if (string.IsNullOrWhiteSpace(item.Sandbox?.Seed)) return null;
        var path = Path.Combine(_root, item.Sandbox.Seed.Replace('/', Path.DirectorySeparatorChar));
        return File.Exists(path) ? path : null;
    }

    public ExerciseCheckFile? LoadChecks(ContentItem item)
    {
        if (string.IsNullOrWhiteSpace(item.Sandbox?.ChecksPath)) return null;
        var path = Path.Combine(_root, item.Sandbox.ChecksPath.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(path)) return null;
        return JsonSerializer.Deserialize<ExerciseCheckFile>(
            File.ReadAllText(path),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    public string? ReadSeedSql(ContentItem item)
    {
        var path = ResolveSeedPath(item);
        return path is null ? null : File.ReadAllText(path);
    }

    private void EnsureLoaded()
    {
        var stamp = NewestContentWriteUtc();
        if (_modules is not null && _items is not null && stamp <= _loadedAtUtc) return;
        lock (_lock)
        {
            stamp = NewestContentWriteUtc();
            if (_modules is not null && _items is not null && stamp <= _loadedAtUtc) return;
            Load();
            _loadedAtUtc = stamp;
        }
    }

    private DateTime NewestContentWriteUtc()
    {
        if (!Directory.Exists(_root)) return DateTime.MinValue;
        var newest = DateTime.MinValue;
        foreach (var file in Directory.EnumerateFiles(_root, "*", SearchOption.AllDirectories))
        {
            var t = File.GetLastWriteTimeUtc(file);
            if (t > newest) newest = t;
        }
        return newest;
    }

    private void Load()
    {
        var modulesPath = Path.Combine(_root, "modules.json");
        if (!File.Exists(modulesPath))
            throw new InvalidOperationException($"Content root mangler modules.json: {_root}");

        _modules = JsonSerializer.Deserialize<List<ModuleCatalogItem>>(
            File.ReadAllText(modulesPath),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        _items = new Dictionary<string, ContentItem>(StringComparer.OrdinalIgnoreCase);
        foreach (var dir in new[] { "lessons", "exercises" })
        {
            var folder = Path.Combine(_root, dir);
            if (!Directory.Exists(folder)) continue;
            foreach (var file in Directory.EnumerateFiles(folder, "*.md", SearchOption.AllDirectories))
            {
                var item = ParseMarkdownFile(file);
                if (item is not null)
                    _items[item.Slug] = item;
            }
        }
    }

    private ContentItem? ParseMarkdownFile(string path)
    {
        var text = File.ReadAllText(path);
        if (!text.StartsWith("---")) return null;
        var end = text.IndexOf("\n---", 3, StringComparison.Ordinal);
        if (end < 0) return null;
        var front = text[3..end].Trim();
        var body = text[(end + 4)..].Trim();

        var meta = _yaml.Deserialize<Dictionary<string, object?>>(front) ?? new();
        var slug = GetString(meta, "slug") ?? Path.GetFileNameWithoutExtension(path);
        var sandbox = ParseSandbox(meta);

        return new ContentItem
        {
            Slug = slug,
            Title = GetString(meta, "title") ?? slug,
            Module = GetString(meta, "module") ?? "",
            Order = GetInt(meta, "order"),
            Kind = GetString(meta, "kind") ?? "theory",
            Objectives = GetStringArray(meta, "objectives"),
            Markdown = body,
            Html = Markdown.ToHtml(body, _pipeline),
            Sandbox = sandbox
        };
    }

    private static SandboxMeta? ParseSandbox(Dictionary<string, object?> meta)
    {
        if (!meta.TryGetValue("sandbox", out var raw) || raw is null) return null;

        string? Get(string key)
        {
            if (raw is Dictionary<object, object> od && od.TryGetValue(key, out var ov))
                return ov?.ToString();
            if (raw is Dictionary<string, object> sd && sd.TryGetValue(key, out var sv))
                return sv?.ToString();
            return null;
        }

        bool allowWrite = false;
        bool.TryParse(Get("allowWrite"), out allowWrite);

        return new SandboxMeta
        {
            Seed = Get("seed"),
            AllowWrite = allowWrite,
            ChecksPath = Get("checks"),
            StarterSql = Get("starterSql")
        };
    }

    private static string? GetString(Dictionary<string, object?> meta, string key) =>
        meta.TryGetValue(key, out var v) ? v?.ToString() : null;

    private static int GetInt(Dictionary<string, object?> meta, string key)
    {
        if (!meta.TryGetValue(key, out var v) || v is null) return 0;
        if (v is int i) return i;
        return int.TryParse(v.ToString(), out var n) ? n : 0;
    }

    private static string[] GetStringArray(Dictionary<string, object?> meta, string key)
    {
        if (!meta.TryGetValue(key, out var v) || v is null) return [];
        if (v is IEnumerable<object> list)
            return list.Select(x => x?.ToString() ?? "").Where(x => x.Length > 0).ToArray();
        return [];
    }
}
