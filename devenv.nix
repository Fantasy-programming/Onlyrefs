{ pkgs,  ... }:

{
  # https://devenv.sh/basics/
  env.GREET = "devenv";

  # https://devenv.sh/packages/
  packages = [ 
    pkgs.git 
    pkgs.openssl
    pkgs.dbus
    pkgs.libsoup
    pkgs.webkitgtk
    pkgs.pkg-config
    pkgs.librsvg
    pkgs.gtk3
  ];

  # https://devenv.sh/languages/
  languages.rust.enable = true;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-slim_22;
    bun.enable = true;
    npm.enable = true;
  };

  languages.typescript.enable = true;
  processes.tauri-watch.exec = "bun run tauri dev";


}
