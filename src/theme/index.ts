"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#c2185b", // 和風の緋色
    },
    secondary: {
      main: "#37474f",
    },
    background: {
      default: "#fafafa",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Hiragino Sans"',
      '"Hiragino Kaku Gothic ProN"',
      '"Noto Sans JP"',
      '"PingFang SC"',
      '"Microsoft YaHei"',
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

export default theme;
