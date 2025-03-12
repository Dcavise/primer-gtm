import React from "react";
import {
  SearchOutlined,
  BarChartOutlined,
  HomeOutlined,
  TeamOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import type { GetProp, MenuProps } from "antd";
import { Link } from "react-router-dom";

type MenuTheme = GetProp<MenuProps, "theme">;
type MenuItem = GetProp<MenuProps, "items">[number];

// Simplified sidebar items based on user request
const items: MenuItem[] = [
  {
    key: "home",
    icon: <HomeOutlined />,
    label: <Link to="/">Home</Link>,
  },
  {
    key: "search",
    icon: <SearchOutlined />,
    label: <Link to="/search">Search</Link>,
  },
  {
    key: "analytics",
    icon: <BarChartOutlined />,
    label: <Link to="/dashboard">Analytics</Link>,
  },
  {
    key: "campus-staff",
    icon: <TeamOutlined />,
    label: <Link to="/campus-staff">Campus Staff</Link>,
  },
  {
    key: "real-estate",
    icon: <BankOutlined />,
    label: <Link to="/real-estate-pipeline">Real Estate</Link>,
  },
];

interface AntSidebarProps {
  defaultSelectedKey?: string;
}

const AntSidebar: React.FC<AntSidebarProps> = ({ defaultSelectedKey = "home" }) => {
  return (
    <div className="ant-sidebar-container">
      <Menu
        style={{ width: 256 }}
        defaultSelectedKeys={[defaultSelectedKey]}
        mode="inline"
        theme="light"
        items={items}
      />
    </div>
  );
};

export default AntSidebar;
