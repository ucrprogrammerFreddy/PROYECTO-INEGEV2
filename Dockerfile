# Etapa 1: build
# Etapa de build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos del proyecto (ajusta la ruta)
COPY API/PowerVital.csproj ./PowerVital.csproj
RUN dotnet restore PowerVital.csproj

# Copiar el resto del proyecto
COPY . .
WORKDIR /src/API
RUN dotnet publish -c Release -o /app/publish

# Etapa de runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "PowerVital.dll"]
