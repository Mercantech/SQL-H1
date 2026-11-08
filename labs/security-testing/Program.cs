using Npgsql;

// Kun en lokal labfixture bruger denne adminkonto. Produktion har en separat appkonto.
var builder = new NpgsqlConnectionStringBuilder
{
    Host = Required("PGHOST"), Port = int.Parse(Environment.GetEnvironmentVariable("PGPORT") ?? "5432"),
    Database = Required("PGDATABASE"),
    Username = Required("PGUSER"), Password = Required("PGPASSWORD"),
    Timeout = 10, CommandTimeout = 10, SslMode = SslMode.Disable
};
if (builder.Database != "gamehub_lab")
    throw new InvalidOperationException("Labben kræver databasen gamehub_lab; brug aldrig produktionsdata.");
await using var conn = new NpgsqlConnection(builder.ConnectionString);
await conn.OpenAsync();

if (args.Contains("--prepare-restore"))
{
    await Execute(conn, "CREATE SCHEMA IF NOT EXISTS gamehub_demo; CREATE TABLE IF NOT EXISTS gamehub_demo.restore_probe(id int PRIMARY KEY, quantity int NOT NULL CHECK (quantity BETWEEN 1 AND 4)); INSERT INTO gamehub_demo.restore_probe VALUES(1,2) ON CONFLICT(id) DO NOTHING;");
    Console.WriteLine("Demo-fixture gamehub_demo.restore_probe er klar til backup. Række id=1 skal have quantity=2.");
    return 0;
}

var suffix = Guid.NewGuid().ToString("N");
var schema = "gh_" + suffix;
var readerRole = "gh_reader_" + suffix;
var failures = 0;
var completed = 0;
var roleCreated = false;
try
{
    // Identifikatorerne er kun vores egne faste præfikser + hex-GUID, aldrig brugerinput.
    await Execute(conn, $"CREATE SCHEMA {schema}; SET search_path TO {schema};");
    await Execute(conn, """
        CREATE TABLE players(id int PRIMARY KEY, display_name text NOT NULL UNIQUE, email text NOT NULL, wins int NOT NULL CHECK(wins>=0));
        INSERT INTO players VALUES (1,'Nova','nova@example.invalid',7),(2,'O''Neil','oneil@example.invalid',4);
        CREATE TABLE tickets(id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, player_id int NOT NULL REFERENCES players(id), ticket_code text NOT NULL UNIQUE, quantity int NOT NULL CHECK(quantity BETWEEN 1 AND 4));
        INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,'FINAL-1',2);
        CREATE TABLE tournaments(id int PRIMARY KEY, remaining int NOT NULL CHECK(remaining>=0));
        INSERT INTO tournaments VALUES(1,1);
        CREATE VIEW v_public_leaderboard AS SELECT display_name,wins FROM players;
        REVOKE ALL ON players FROM PUBLIC;
        """);
    await Execute(conn, $"CREATE ROLE {readerRole} NOLOGIN;");
    roleCreated = true;
    await Execute(conn, $"GRANT USAGE ON SCHEMA {schema} TO {readerRole}; GRANT SELECT ON {schema}.v_public_leaderboard TO {readerRole};");

    await Check("Parametre finder et normalt navn", async () =>
        Equal(1, (await FindPlayers(conn, "Nova")).Count));
    await Check("Parametre bevarer en legitim apostrof", async () =>
        Equal("O'Neil", (await FindPlayers(conn, "O'Neil")).Single()));
    await Check("Fjendtlig tekst ændrer ikke forespørgslen", async () =>
        Equal(0, (await FindPlayers(conn, "Nova' OR '1'='1")).Count));
    await Check("Positiv grænse: én billet accepteres", async () =>
        Equal(1, await Execute(conn,"INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(2,'BOUNDARY-1',1)")));
    await Check("Positiv grænse: fire billetter accepteres", async () =>
        Equal(1, await Execute(conn,"INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(2,'BOUNDARY-4',4)")));
    await Check("CHECK afviser nul med SQLSTATE 23514", () => ThrowsPg(conn,
        "INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,'ZERO',0)", "23514"));
    await Check("CHECK afviser fem med SQLSTATE 23514", () => ThrowsPg(conn,
        "INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,'FIVE',5)", "23514"));
    await Check("NOT NULL afviser NULL med SQLSTATE 23502", () => ThrowsPg(conn,
        "INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,'NULL-QTY',NULL)", "23502"));
    await Check("FK afviser ukendt spiller med SQLSTATE 23503", () => ThrowsPg(conn,
        "INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(9999,'MISSING',1)", "23503"));
    await Check("UNIQUE afviser dublet med SQLSTATE 23505", () => ThrowsPg(conn,
        "INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(2,'FINAL-1',1)", "23505"));

    await Check("Begrænset rolle kan læse viewet", async () =>
    {
        await using var tx = await conn.BeginTransactionAsync();
        await Execute(conn,$"SET LOCAL ROLE {readerRole}",tx);
        Equal(2,await ScalarInt(conn,$"SELECT COUNT(*)::int FROM {schema}.v_public_leaderboard",tx));
        await tx.RollbackAsync();
    });
    await Check("Begrænset rolle kan ikke læse private e-mails", async () =>
    {
        await using var tx = await conn.BeginTransactionAsync();
        await Execute(conn,$"SET LOCAL ROLE {readerRole}",tx);
        await ThrowsPg(conn,$"SELECT email FROM {schema}.players", "42501", tx);
        await tx.RollbackAsync();
    });
    await Check("Rollback fjerner en halv reservation", async () =>
    {
        await using var tx = await conn.BeginTransactionAsync();
        Equal(1,await Execute(conn,"UPDATE tournaments SET remaining=remaining-1 WHERE id=1 AND remaining>0",tx));
        await ThrowsPg(conn,"INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,'FINAL-1',1)","23505",tx);
        await tx.RollbackAsync();
        Equal(1,await ScalarInt(conn,"SELECT remaining FROM tournaments WHERE id=1"));
        Equal(1,await ScalarInt(conn,"SELECT COUNT(*)::int FROM tickets WHERE ticket_code='FINAL-1'"));
    });
    await Check("To forbindelser: sidste plads har kun én vinder", async () =>
    {
        await using var first = new NpgsqlConnection(builder.ConnectionString);
        await using var second = new NpgsqlConnection(builder.ConnectionString);
        await first.OpenAsync(); await second.OpenAsync();
        var gate = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<int> Reserve(NpgsqlConnection connection)
        {
            await gate.Task;
            return await Execute(connection,$"UPDATE {schema}.tournaments SET remaining=remaining-1 WHERE id=1 AND remaining>0");
        }
        var one = Reserve(first); var two = Reserve(second); gate.SetResult(true);
        var results = await Task.WhenAll(one,two);
        Equal(1,results.Sum());
        Equal(0,await ScalarInt(conn,"SELECT remaining FROM tournaments WHERE id=1"));
    });
}
finally
{
    await Execute(conn,$"SET search_path TO public; DROP SCHEMA IF EXISTS {schema} CASCADE;");
    if (roleCreated) await Execute(conn,$"DROP ROLE {readerRole};");
}
Console.WriteLine($"{completed - failures}/{completed} tests bestod. {failures} fejl. Fixture ryddet op.");
return failures == 0 ? 0 : 1;

async Task Check(string name, Func<Task> action)
{
    completed++;
    try { await action(); Console.WriteLine("PASS · " + name); }
    catch (Exception ex)
    {
        failures++;
        // Udskriv aldrig connection string eller inputcredentials.
        Console.WriteLine("FAIL · " + name + " · " + (ex is PostgresException pg ? "SQLSTATE " + pg.SqlState : ex.Message));
    }
}

static async Task<List<string>> FindPlayers(NpgsqlConnection connection,string input)
{
    await using var command = new NpgsqlCommand("SELECT display_name FROM players WHERE display_name=@name ORDER BY id",connection);
    command.Parameters.AddWithValue("name",input);
    await using var rows = await command.ExecuteReaderAsync();
    var result = new List<string>();
    while (await rows.ReadAsync()) result.Add(rows.GetString(0));
    return result;
}
static async Task<int> Execute(NpgsqlConnection connection,string sql,NpgsqlTransaction? transaction=null)
{
    await using var command = new NpgsqlCommand(sql,connection,transaction);
    return await command.ExecuteNonQueryAsync();
}
static async Task<int> ScalarInt(NpgsqlConnection connection,string sql,NpgsqlTransaction? transaction=null)
{
    await using var command = new NpgsqlCommand(sql,connection,transaction);
    return Convert.ToInt32(await command.ExecuteScalarAsync());
}
static async Task ThrowsPg(NpgsqlConnection connection,string sql,string expectedState,NpgsqlTransaction? transaction=null)
{
    try { await Execute(connection,sql,transaction); }
    catch (PostgresException ex) when (ex.SqlState==expectedState) { return; }
    throw new InvalidOperationException("Forventede SQLSTATE " + expectedState + ", men handlingen blev accepteret.");
}
static void Equal<T>(T expected,T actual)
{
    if(!EqualityComparer<T>.Default.Equals(expected,actual))
        throw new InvalidOperationException($"Forventede {expected}, fik {actual}.");
}
static string Required(string name) => Environment.GetEnvironmentVariable(name) is {Length:>0} value
    ? value : throw new InvalidOperationException("Manglende miljøvariabel: " + name);
