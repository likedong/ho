/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { PureComponent } from "react";
import { Layout, Menu, Icon } from "antd";
import pathToRegexp from "path-to-regexp";
import { Link } from "dva/router";
import styles from "./index.less";
import { urlToList } from "../_utils/pathTools";
import { getCurrentLocale, getIntlContent } from "../../utils/IntlUtils";
// import { emit } from '../../utils/emit'

const { Sider } = Layout;
const { SubMenu } = Menu;

// Allow menu.js config icon as string or ReactNode
//   icon: 'setting',
//   icon: 'http://demo.com/icon.png',
//   icon: <Icon type="setting" />,
const getIcon = icon => {
  if (typeof icon === "string") {
    if (icon.indexOf("http") === 0) {
      return (
        <img
          src={icon}
          alt="icon"
          className={`${styles.icon} sider-menu-item-img`}
        />
      );
    }
    return <Icon type={icon} />;
  }

  return icon;
};

/**
 * Recursively flatten the data
 * [{path:string},{path:string}] => [path,path2]
 * @param  menu
 */
export const getFlatMenuKeys = menu => {
  return menu.reduce((keys, item) => {
    keys.push(item.path);
    if (item.children) {
      return keys.concat(getFlatMenuKeys(item.children));
    }
    return keys;
  }, []);
};

/**
 * Find all matched menu keys based on paths
 * @param  flatMenuKeys: [/abc, /abc/:id, /abc/:id/info]
 * @param  paths: [/abc, /abc/11, /abc/11/info]
 */
export const getMenuMatchKeys = (flatMenuKeys, paths) =>
  paths.reduce(
    (matchKeys, path) =>
      matchKeys.concat(
        flatMenuKeys.filter(item => pathToRegexp(item).test(path))
      ),
    []
  );

export default class SiderMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.flatMenuKeys = getFlatMenuKeys(props.menuData);
    this.state = {
      openKeys: this.getDefaultCollapsedSubMenus(props),
      localeName: ""
    };
  }

  componentWillReceiveProps(nextProps) {
    const { location, menuData } = this.props;
    this.flatMenuKeys = getFlatMenuKeys(menuData);
    if (nextProps.location.pathname !== location.pathname) {
      this.setState({
        openKeys: this.getDefaultCollapsedSubMenus(nextProps)
      });
    }
  }

  /**
   * Convert pathname to openKeys
   * /list/search/articles = > ['list','/list/search']
   * @param  props
   */
  getDefaultCollapsedSubMenus(props) {
    const {
      location: { pathname }
    } =
      props || this.props;
    return getMenuMatchKeys(this.flatMenuKeys, urlToList(pathname));
  }

  saveCurrentRoute = route => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/saveCurrentRoutr",
      payload: {
        currentRouter: route
      }
    });
  };

  /**
   * Judge whether it is http link.return a or Link
   *
   * member of SiderMenu
   */
  getMenuItemPath = item => {
    const itemPath = this.conversionPath(item.path);
    const icon = getIcon(item.icon);
    const { target, name } = item;
    // Is it a http link
    if (/^https?:\/\//.test(itemPath)) {
      return (
        <a href={itemPath} target={target}>
          {icon}
          <span>{name}</span>
        </a>
      );
    }
    const { location, isMobile, onCollapse } = this.props;
    return (
      <Link
        to={itemPath}
        target={target}
        replace={itemPath === location.pathname}
        onClick={
          isMobile
            ? () => {
                onCollapse(true);
              }
            : undefined
        }
      >
        {icon}
        <span>{name}</span>
      </Link>
    );
  };

  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = item => {
    if (item.children && item.children.some(child => child.name)) {
      const childrenItems = this.getNavMenuItems(item.children);
      // The menu is not displayed when there are no submenus
      if (childrenItems && childrenItems.length > 0) {
        return (
          <SubMenu
            title={
              item.icon ? (
                <span>
                  {getIcon(item.icon)}
                  <span>{item.name}</span>
                </span>
              ) : (
                item.name
              )
            }
            key={item.path}
          >
            {childrenItems}
          </SubMenu>
        );
      }
      return null;
    } else {
      return (
        <Menu.Item
          onClick={() => {
            this.saveCurrentRoute(item);
          }}
          key={item.path}
        >
          {this.getMenuItemPath(item)}
        </Menu.Item>
      );
    }
  };

  /**
   * Get the menu items
   */
  getNavMenuItems = menusData => {
    if (!menusData) {
      return [];
    }
    return menusData
      .filter(item => item.name && !item.hideInMenu)
      .map(item => {
        // make dom
        const ItemDom = this.getSubMenuOrItem(item);
        return this.checkPermissionItem(item.authority, ItemDom);
      })
      .filter(item => item);
  };

  // Get the currently selected menu
  getSelectedMenuKeys = () => {
    const {
      location: { pathname }
    } = this.props;

    // console.log(this.flatMenuKeys, urlToList(pathname));
    return getMenuMatchKeys(this.flatMenuKeys, urlToList(pathname));
  };

  // conversion Path
  conversionPath = path => {
    if (path && path.indexOf("http") === 0) {
      return path;
    } else {
      return `/${path || ""}`.replace(/\/+/g, "/");
    }
  };

  // permission to check
  checkPermissionItem = (authority, ItemDom) => {
    const { Authorized } = this.props;
    if (Authorized && Authorized.check) {
      const { check } = Authorized;
      return check(authority, ItemDom);
    }
    return ItemDom;
  };

  isMainMenu = key => {
    const { menuData } = this.props;
    return menuData.some(
      item => key && (item.key === key || item.path === key)
    );
  };

  handleOpenChange = openKeys => {
    const lastOpenKey = openKeys[openKeys.length - 1];
    const moreThanOne =
      openKeys.filter(openKey => this.isMainMenu(openKey)).length > 1;
    this.setState({
      openKeys: moreThanOne ? [lastOpenKey] : [...openKeys]
    });
  };

  /** Modify the menu based on the current language */
  updateMenuData() {
    if (this.props.menuData.length === 0) {
      return;
    }

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.props.menuData.length; i++) {
      if (this.props.menuData[i].locale) {
        this.props.menuData[i].name = getIntlContent(
          this.props.menuData[i].locale,
          this.props.menuData[i].name
        );
      }

      if (this.props.menuData[i].children.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < this.props.menuData[i].children.length; j++) {
          if (this.props.menuData[i].children[j].locale) {
            this.props.menuData[i].children[j].name = getIntlContent(
              this.props.menuData[i].children[j].locale,
              this.props.menuData[i].children[j].name
            );
          }
        }
      }
    }
  }

  changeLocale(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    this.updateMenuData();
    const { logo, menuData, collapsed, onCollapse } = this.props;
    const { openKeys } = this.state;
    // Don't show popup menu when it is been collapsed
    const menuProps = collapsed
      ? {}
      : {
          openKeys
        };
    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedMenuKeys();
    if (!selectedKeys.length) {
      selectedKeys = [openKeys[openKeys.length - 1]];
    }

    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onCollapse={onCollapse}
        width={220}
        className={styles.sider}
      >
        <Link to="/">
          <div className={styles.logo} key="logo">
            <img className={styles.icon} src={logo} alt="logo" />
            <div className={styles.systemTitle}>
              <div className={styles.title}>
                {getIntlContent("SHENYU.SIDERMENU.TITLE")}
              </div>
              <div className={styles.subTitle}>
                {getIntlContent("SHENYU.SIDERMENU.SUBTITLE")}
              </div>
            </div>
          </div>
        </Link>
        <Menu
          key="Menu"
          theme="dark"
          mode="inline"
          {...menuProps}
          onOpenChange={this.handleOpenChange}
          selectedKeys={selectedKeys}
          style={{ padding: "16px 0", width: "100%" }}
        >
          {this.getNavMenuItems(menuData)}
        </Menu>
      </Sider>
    );
  }
}
