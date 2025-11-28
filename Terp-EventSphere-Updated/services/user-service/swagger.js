const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Terp EventSphere User Service API',
      version: '1.0.0',
      description: 'API documentation for User Service - User Registration, Authentication, Profile Management, Password Reset, and Admin Operations',
      contact: {
        name: 'Terp EventSphere Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe',
              minLength: 2,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'password123',
              minLength: 6,
            },
            role: {
              type: 'string',
              enum: ['participant', 'event_organizer', 'administrator'],
              description: 'User role',
              example: 'participant',
            },
          },
        },
        RegisterSuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User registered successfully',
            },
            user: {
              type: 'object',
              properties: {
                userID: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'john@example.com',
                },
                name: {
                  type: 'string',
                  example: 'John Doe',
                },
                role: {
                  type: 'string',
                  enum: ['participant', 'event_organizer', 'administrator'],
                  example: 'participant',
                },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'password123',
            },
          },
        },
        LoginSuccessResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                userID: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'john@example.com',
                },
                name: {
                  type: 'string',
                  example: 'John Doe',
                },
                role: {
                  type: 'string',
                  enum: ['participant', 'event_organizer', 'administrator'],
                  example: 'participant',
                },
              },
            },
          },
        },
        ProfileResponse: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['participant', 'event_organizer', 'administrator'],
              example: 'participant',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Updated name (optional)',
              example: 'John Updated',
              minLength: 2,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Updated email (optional)',
              example: 'john.updated@example.com',
            },
          },
        },
        UpdateProfileSuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Profile updated successfully',
            },
            user: {
              type: 'object',
              properties: {
                user_id: {
                  type: 'string',
                  format: 'uuid',
                  example: '123e4567-e89b-12d3-a456-426614174000',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'john.updated@example.com',
                },
                name: {
                  type: 'string',
                  example: 'John Updated',
                },
                role: {
                  type: 'string',
                  enum: ['participant', 'event_organizer', 'administrator'],
                  example: 'participant',
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-15T10:30:00Z',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-15T11:00:00Z',
                },
              },
            },
          },
        },
        PasswordResetRequestRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address of the user requesting password reset',
              example: 'john@example.com',
            },
          },
        },
        PasswordResetRequestResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'If the email exists, a password reset link has been sent',
            },
            resetToken: {
              type: 'string',
              description: 'Reset token (only returned in development - should be sent via email in production)',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Token expiration time',
              example: '2024-01-15T11:30:00Z',
            },
          },
        },
        PasswordResetRequest: {
          type: 'object',
          required: ['resetToken', 'newPassword'],
          properties: {
            resetToken: {
              type: 'string',
              description: 'Password reset token received from request endpoint',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            newPassword: {
              type: 'string',
              description: 'New password',
              example: 'newSecurePassword123',
              minLength: 6,
            },
          },
        },
        PasswordResetSuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Password reset successfully',
            },
          },
        },
        UsersListResponse: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/ProfileResponse',
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Missing required fields: name, email, password, role',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

