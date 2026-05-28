# Stage 1: Build the Spring Boot application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and resolve dependencies to cache them
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and compile
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the executable JAR
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-jar", "app.jar"]
