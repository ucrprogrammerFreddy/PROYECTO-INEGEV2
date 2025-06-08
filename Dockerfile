# Etapa 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY *.sln .
COPY API/*.csproj ./API/
RUN dotnet restore ./API/API.csproj

COPY API/. ./API/
WORKDIR /app/API
RUN dotnet publish -c Release -o out

# Etapa 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/API/out ./
ENTRYPOINT ["dotnet", "API.dll"]
