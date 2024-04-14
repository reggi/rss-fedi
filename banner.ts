export const banner = `  ____  ____ ____   __     ___   __  ______   ___   ____  __  ___      ___  ____  ____ \r\n ||    ||    || \\\\  ||    \/\/ \\\\ (( \\ | || |  \/\/ \\\\  || \\\\ || \/\/ \\\\    \/\/ \\\\ || \\\\ || \\\\\r\n ||==  ||==  ||  )) ||    ||=||  \\\\    ||   ((   )) ||_\/\/ || ||=||    ||=|| ||_\/\/ ||_\/\/\r\n ||    ||___ ||_\/\/  || || || || \\_))   ||    \\\\_\/\/  || \\\\ || || || || || || ||    ||   \r\n                                                                                       
`;

export const home = ({
  banner,
  handle,
  url,
  followers,
}: {
  banner: string;
  handle: string;
  url: URL;
  followers: any[];
}) => `\
${banner}

This small federated server app is a demo of Fedify.  The only one
thing it does is to accept follow requests.

You can follow this demo app via the below handle:

    @${handle}@${url.host}

This account has the below ${followers.length} followers:

    ${followers.join("\n    ")}
`;
