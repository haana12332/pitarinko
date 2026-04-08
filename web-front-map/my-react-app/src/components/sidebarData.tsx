import MenuIcon from "@mui/icons-material/Menu";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import SearchIcon from "@mui/icons-material/Search";
import HttpIcon from "@mui/icons-material/Http";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
export const SidebarData = [
  {
    title: "",
    icon: <MenuIcon className="sidebar-icon" />, // アイコンにカスタムクラスを適用
    link: "/menu",
  },
  {
    title: "トレンド",
    icon: <SearchIcon className="sidebar-icon" />, // 同じく適用
    link: "/search",
  },
  {
    title: "ユーザー",
    icon: <PermIdentityIcon className="sidebar-icon" />, // 同じく適用
    link: "/user",
  },
  {
    title: "post",
    icon: <AddCircleOutlineIcon className="sidebar-icon" />, // 同じく適用
    link: "/post",
  },
  {
    title: "http",
    icon: <HttpIcon className="sidebar-icon" />,
    link: "/http",
  },
];
