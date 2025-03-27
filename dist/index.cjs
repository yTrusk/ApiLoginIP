const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3333;
const DISCORD_BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN ||
  "MTI4MzE2MDQ4NzEzOTQ3NTY0OA.G3K6-f.mYSNJ8FxemJ7HUf12hM1HXdG-nGqUOXYHCSFAQ"; // Discord Bot Token

app.use(express.static("public"));
app.use(cors());

app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const userData = await fetchDiscordUserData(userId);

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const extendedUserData = processUserData(userData);
    res.json(extendedUserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function fetchDiscordUserData(userId) {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/users/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      } else {
        throw new Error("Failed to fetch user information");
      }
    }

    return response.json();
  } catch (error) {
    throw new Error("Failed to fetch user information");
  }
}

function processUserData(userData) {
  const isBot = userData.bot || false;
  const isSystem = userData.system || false;
  console.log(userData)
  const userFlags = resolveUserFlags(userData.flags);
  const nitroType = resolveNitroType(userData.premium_type);
  const avatarUrl = userData.avatar
    ? getImageUrl("avatar", userData.id, userData.avatar, "png", 4096)
    : "https://cdn.discordapp.com/embed/avatars/index.png";

  const bannerUrl = userData.banner
    ? getImageUrl("banner", userData.id, userData.banner, "png", 4096)
    : null;
  const userAvatarDecorationUrl = userData.avatar_decoration
    ? `https://cdn.discordapp.com/avatar-decorations/${userData.id}/${userData.avatar_decoration}.png`
    : userData.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${userData.avatar_decoration_data.asset}.png?4096`
    : null;

  const creationDate = getCreationDate(userData.id);
  const creationDateFormatted = new Date(creationDate).toLocaleString();

  return {
    id: userData.id,
    global_name: userData.global_name,
    username: userData.username,
    discriminator: userData.discriminator,
    avatar: avatarUrl,
    avatarDecoration: userAvatarDecorationUrl,
    banner: bannerUrl,
    accentColor: userData.accent_color,
    bannerColor: userData.banner_color,
    isBot,
    isSystem,
    flags: userFlags,
    nitroType,
    creationDate: creationDateFormatted,
  };
}

function getImageUrl(type, id, hash, format = "png", size = 128) {
  const baseUrl =
    type === "avatar"
      ? "https://cdn.discordapp.com/avatars"
      : "https://cdn.discordapp.com/banners";
  const isGif = hash.startsWith("a_");
  const actualFormat = isGif ? "gif" : format;
  const path = `${id}/${hash}.${actualFormat}`;
  return `${baseUrl}/${path}`;
}

function resolveUserFlags(flags) {
  const userFlags = [];
  const defaultFlagsConfig = getDefaultFlagsConfig();

  for (const [flagValue, flagData] of Object.entries(defaultFlagsConfig)) {
    const intValue = parseInt(flagValue);

    if (flags & intValue) {
      userFlags.push({ value: intValue, ...flagData });
    }
  }

  return userFlags;
}

function getDefaultFlagsConfig() {
  return {
    1: {
      name: "STAFF",
      description: "Discord Employee",
      icon: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png",
    },
    2: {
      name: "PARTNER",
      description: "Partnered Server Owner",
      icon: "https://cdn.discordapp.com/attachments/1186583830820290597/1190245049355743292/6714-discord-partner.png",
    },
    4: {
      name: "HYPESQUAD",
      description: "HypeSquad Events Member",
      icon: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png",
    },
    8: {
      name: "BUG_HUNTER_LEVEL_1",
      description: "Bug Hunter Level 1",
      icon: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png",
    },
    64: {
      name: "HYPESQUAD_ONLINE_HOUSE_1",
      description: "House Bravery Member",
      icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png",
    },
    128: {
      name: "HYPESQUAD_ONLINE_HOUSE_2",
      description: "House Brilliance Member",
      icon: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png",
    },
    256: {
      name: "HYPESQUAD_ONLINE_HOUSE_3",
      description: "House Balance Member",
      icon: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png",
    },
    512: {
      name: "PREMIUM_EARLY_SUPPORTER",
      description: "Early Nitro Supporter",
      icon: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png",
    },
    1024: {
      name: "TEAM_PSEUDO_USER",
      description: "User is a team",
      icon: "icon-url-for-team-pseudo-user",
    },
    16384: {
      name: "BUG_HUNTER_LEVEL_2",
      description: "Bug Hunter Level 2",
      icon: "icon-url-for-bug-hunter-level-2",
    },
    65536: {
      name: "VERIFIED_BOT",
      description: "Verified Bot",
      icon: "https://cdn.discordapp.com/attachments/1186583830820290597/1190245723300708393/verified-bot.png",
    },
    131072: {
      name: "VERIFIED_DEVELOPER",
      description: "Early Verified Bot Developer",
      icon: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png",
    },
    262144: {
      name: "CERTIFIED_MODERATOR",
      description: "Moderator Programs Alumni",
      icon: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png",
    },
    524288: {
      name: "BOT_HTTP_INTERACTIONS",
      description:
        "Bot uses only HTTP interactions and is shown in the online member list",
      icon: "icon-url-for-bot-http-interactions",
    },
    4194304: {
      name: "ACTIVE_DEVELOPER",
      description: "User is an Active Developer",
      icon: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png",
    },
  };
}

function resolveNitroType(premiumType) {
  const premiumTypeNumber = parseInt(premiumType);
  console.log(premiumTypeNumber);
  const nitroTypes = {
    0: {
      value: 0,
      name: "None",
      description: "No Nitro",
      icon: "",
    },
    1: {
      value: 1,
      name: "Nitro Classic",
      description: "Nitro Classic",
      icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png",
    },
    2: {
      value: 2,
      name: "Nitro",
      description: "Nitro",
      icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png",
    },
    3: {
      value: 3,
      name: "Nitro Basic",
      description: "Nitro Basic",
      icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png",
    },
  };

  return (
    nitroTypes[premiumTypeNumber] || {
      value: 0,
      name: "Unknown",
      description: "Unknown Nitro Type",
      icon: "icon-url-for-unknown",
    }
  );
}

function getCreationDate(snowflake) {
  return snowflake / 4194304 + 1420070400000;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
