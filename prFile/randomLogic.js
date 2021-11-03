const { Client } = require("discord.js");

const fs = require("fs");

const Bot_Token = "THIS IS BOT TOKEN";

const client = new Client();

client.login(Bot_Token);

const prefix = "!";
const validChannelIds = ["897483638214639666"];

const teamRoles = [
    "1-komanda",
    "2-komanda",
    "3-komanda",
    "4-komanda",
    "5-komanda",
    "6-komanda",
    "7-komanda",
    "8-komanda",
    "9-komanda",
];

var Teams = [
    {
        channelId: "897483638214639666",
        questionsCompleted: 0,
        currentQuestion: null,
    },
];

function handleStart(
    command,
    channelId,
    message
) {
    var teamIndex = Teams.findIndex((x) => x.channelId == channelId);

    if (Teams[teamIndex] && command == "start") {
        message.channel?.send("Pirmoji užduotis:");
        message.channel?.send(
            "Baltųjų ėjimas. Parašykite koks vienintelis ėjimas leidžia baltiesiems pasiekti matą dviem ėjimais.",
            {
                files: ["./dist/Sachmatai.PNG"],
            }
        );
        Teams[teamIndex].currentQuestion = 1;
    }
}

function handleJoinTeam(
    command,
    arg,
    channelId,
    message
) {
    if (command == "join") {
        var hasTeam = false;
        message.member?.roles.cache.forEach((role) =>
            teamRoles.some((teamRole) =>
                teamRole == role.name ? (hasTeam = true) : null
            )
        );
        if (!hasTeam) {
            var roleId =
                message.member?.roles.cache.get(`${arg}-komanda`)?.id ?? "";

            message.member?.roles.add(roleId);
        } else {
            message.channel?.send("Jau turite komandą!");
        }
    }
}

client.on("message", function (message) {
    console.log(message.content);

    if (message.author?.bot) {
        console.log("Bot message:");
        return;
        console.log(message)
    }

    if (validChannelIds.find((x) => x == message.channel?.id)) {
        if (message.content?.startsWith(prefix)) {
            const commandBody = message.content?.slice(prefix.length);
            const args = commandBody?.split(" ");
            const command = args?.shift()?.toLowerCase();

            handleStart(command ?? "", message.channel?.id, message);

            handleJoinTeam(
                command ?? "",
                args[0],
                message.channel?.id,
                message
            );
        } else {
            message.delete();
        }
    }
});