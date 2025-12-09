import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Filters
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('TechHelpDesk API')
    .setDescription(
      `API REST for system of Technical Support - TechHelpDesk
      
## Description
This API allows to manage the complete life cycle of tickets of technical support.

## Roles
- **Administrator**: CRUD completo of users, technicians, clients, categories and tickets.
- **Technician**: Consult and update of assigned tickets.
- **Client**: Registration of new tickets and history consultation.

## Authentication
The API uses JWT (JSON Web Token) for authentication. Include the token in the header:
\`Authorization: Bearer <token>\`
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Categories', 'Category management')
    .addTag('Clients', 'Client management')
    .addTag('Technicians', 'Technician management')
    .addTag('Tickets', 'Ticket management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);

  Logger.log(`TechHelpDesk API running on port ${port}`);
  Logger.log(`Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
