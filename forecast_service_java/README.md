# Forecast Service (Java)

This is a small Spring Boot microservice that implements a simple demand forecast endpoint compatible with the previous Python service.

Endpoint
- POST `/predict` — body: `{ "history": [numbers], "horizon": 7 }` — returns `{ "forecast": [numbers] }`

Run (requires Java 17+ and Maven):

```cmd
cd "D:\Infosys\Stationary website\forecast_service_java"
mvn -q clean package
mvn -q spring-boot:run
```

The service will start on port `5000` and behave like the earlier Python `/predict` endpoint.
