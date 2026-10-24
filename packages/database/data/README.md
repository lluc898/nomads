# Catálogo geográfico

`countries.csv` y `airports.csv` son una instantánea del 24 de octubre de 2026
del catálogo mundial de [OurAirports](https://ourairports.com/data/).

OurAirports actualiza estos ficheros diariamente y publica los datos en dominio
público. El importador conserva países y aeropuertos activos de tipo grande,
mediano, pequeño o hidroaeropuerto. Se excluyen instalaciones cerradas,
helipuertos y balloonports.

Para actualizar la instantánea, descarga de nuevo:

- `https://davidmegginson.github.io/ourairports-data/countries.csv`
- `https://davidmegginson.github.io/ourairports-data/airports.csv`

Después ejecuta `pnpm --filter @viajeroshub/database db:deploy`.
