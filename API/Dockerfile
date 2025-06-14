# Imagen base para compilación
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /app

# Copiar archivos del proyecto
COPY . . 

# Restaurar dependencias y compilar
RUN dotnet restore
RUN dotnet publish -c Release -o out

# Imagen base para producción
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app/out .

# Puerto expuesto
EXPOSE 80

# Comando de inicio
ENTRYPOINT ["dotnet", "PowerVital.API.dll"]
