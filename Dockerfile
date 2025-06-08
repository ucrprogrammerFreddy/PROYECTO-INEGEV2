# Etapa 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivo del proyecto
COPY PowerVital.csproj .

# Restaurar dependencias
RUN dotnet restore

# Copiar todo el código fuente
COPY . .

# Publicar en carpeta /app/publish
RUN dotnet publish -c Release -o /app/publish

# Etapa 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copiar la app publicada desde el contenedor build
COPY --from=build /app/publish .

# Ejecutar la API
ENTRYPOINT ["dotnet", "PowerVital.dll"]
