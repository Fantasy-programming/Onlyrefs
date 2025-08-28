{ pkgs,  ... }:

{

  packages = [
    pkgs.openssl
    pkgs.dbus
    pkgs.libsoup_3
    pkgs.webkitgtk_4_1
    pkgs.pkg-config
    pkgs.librsvg
    pkgs.gtk3
    pkgs.libcanberra-gtk3
  ];

  languages.rust.enable = true;
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs-slim_24;
    bun.enable = true;
  };

  languages.typescript.enable = true;

}
