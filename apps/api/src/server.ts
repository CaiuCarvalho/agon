import Fastify from "fastify";

const app = Fastify();

app.get("/", async () => {
    return {
        status: "ok",
        project: "agon"
    };
});

app.listen({ port: 3333 }).then(() => {
    console.log("🚀 API rodando em http://localhost:3333");
});