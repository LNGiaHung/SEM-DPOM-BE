import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Your API Title",
            version: "1.0.0",
            description: "API documentation for your application",
        },
        servers: [
            {
                url: "http://localhost:5000/api/v1", // Change this to your server URL
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./controllers/*.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app) => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}; 