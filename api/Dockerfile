# Build context: repo root (se docker-compose.yml)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY api/SqlH1.Api.csproj api/
RUN dotnet restore api/SqlH1.Api.csproj
COPY api/ api/
COPY content/ /content/
RUN dotnet publish api/SqlH1.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /content /content
ENV ASPNETCORE_URLS=http://0.0.0.0:3001
ENV CONTENT_ROOT=/content
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
  CMD curl -fsS http://127.0.0.1:3001/api/health || exit 1
ENTRYPOINT ["dotnet", "SqlH1.Api.dll"]
