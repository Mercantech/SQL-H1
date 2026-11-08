FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /work
COPY .config/dotnet-tools.json .config/dotnet-tools.json
RUN dotnet tool restore
COPY . .
CMD ["dotnet", "--info"]
