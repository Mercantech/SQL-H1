#!/bin/sh
set -eu
cd /work
: "${LEGACY_CONNECTION_STRING:?LEGACY_CONNECTION_STRING mangler}"

dotnet tool restore
dotnet restore DatabaseFirst
dotnet ef dbcontext scaffold "$LEGACY_CONNECTION_STRING" Npgsql.EntityFrameworkCore.PostgreSQL \
    --project DatabaseFirst \
    --context LegacyContext \
    --context-dir Generated \
    --output-dir Generated \
    --namespace GameHub.Legacy.Generated \
    --context-namespace GameHub.Legacy.Generated \
    --no-onconfiguring \
    --no-pluralize \
    --force

mkdir -p DatabaseFirst/Extensions
if [ ! -f DatabaseFirst/Extensions/Tournament.Display.cs ]; then
    cp tools/Tournament.Display.cs.template DatabaseFirst/Extensions/Tournament.Display.cs
fi
dotnet build LegacyDemo
printf '\nKlar: docker compose run --rm workshop dotnet run --project LegacyDemo\n'
