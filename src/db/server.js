const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("src/db/products.json");

// ✅ Додай CORS middleware перед усім
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  // ⚠️ Обробка preflight запитів
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Потім стандартні middleware
const middlewares = jsonServer.defaults();
server.use(middlewares);

// Маршрути
server.use(router);

// Прив’язка до 0.0.0.0 для доступу з мережі
server.listen(3001, "0.0.0.0", () => {
  console.log("✅ JSON Server is running on http://0.0.0.0:3001");
});
