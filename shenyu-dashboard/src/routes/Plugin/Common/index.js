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

import React, { Component } from "react";
import { Table, Row, Col, Button, Input, message,Popconfirm } from "antd";
import { connect } from "dva";
import styles from "../index.less";
import Selector from "./Selector";
import Rule from "./Rule";
import { getIntlContent, getCurrentLocale } from '../../../utils/IntlUtils'
import AuthButton from "../../../utils/AuthButton";

const { Search } = Input;

@connect(({ common, global, loading }) => ({
  ...global,
  ...common,
  loading: loading.effects["global/fetchPlatform"]
}))
export default class Common extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectorPage: 1,
      rulePage: 1,
      popup: "",
      localeName:'',
      selectorName: undefined,
      ruleName: undefined
    };
  }

  componentDidMount() {
    const { dispatch, plugins } = this.props;
    if(plugins && plugins.length > 0){
      this.getAllSelectors(1, plugins);
    }else{
      dispatch({
        type: "global/fetchPlugins",
        payload: {
          callback: (pluginList) => {
            this.getAllSelectors(1, pluginList);
          }
        }
      })
    }
  }

  componentDidUpdate(prevProps) {

    const preId = prevProps.match.params.id
    const newId = this.props.match.params.id;

    if (newId !== preId) {
      const { dispatch } = this.props;

      dispatch({
        type: "common/resetData",
      });

      if(prevProps.plugins && prevProps.plugins.length > 0){
        this.getAllSelectors(1, prevProps.plugins);
      }else{
        dispatch({
          type: "global/fetchPlugins",
          payload: {
            callback: (pluginList) => {
              this.getAllSelectors(1, pluginList);
            }
          }
        })
      }
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: "common/resetData",
    });
  }

  getAllSelectors = (page, plugins) => {
    const { dispatch } = this.props;
    const { selectorName } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : '';
    const tempPluginId = this.getPluginId(plugins, name);
    this.setState({pluginId : tempPluginId});
    dispatch({
      type: "common/fetchSelector",
      payload: {
        currentPage: page,
        pageSize: 12,
        pluginId: tempPluginId,
        name: selectorName
      }
    });
  };

  getAllRules = page => {
    const { dispatch, currentSelector } = this.props;
    const { ruleName } = this.state;
    const selectorId = currentSelector ? currentSelector.id : "";
    dispatch({
      type: "common/fetchRule",
      payload: {
        selectorId,
        currentPage: page,
        pageSize: 12,
        name: ruleName
      }
    });
  };

  getPlugin = (plugins, name) => {
    const plugin = plugins.filter(item => {
      return item.name === name;
    });
    return (plugin && plugin.length > 0) ? plugin[0] : null;
  };

  getPluginId = (plugins, name) => {
    let plugin = this.getPlugin(plugins, name);
    if (plugin) {
      return plugin.id;
    } else {
      return "";
    }
  };

  getPluginConfigField = (config,fieldName) => {
    if(config){
      let configObj = JSON.parse(config);
      return configObj[fieldName];
     }else {
      return "";
     }
  }

  closeModal = () => {
    this.setState({ popup: "" });
  };

  searchSelectorOnchange = e => {
    const selectorName = e.target.value;
    this.setState({ selectorName });
  };

  searchSelector = () => {
    const { plugins } = this.props;
    this.setState({ selectorPage: 1 });
    this.getAllSelectors(1, plugins);
  }

  addSelector = () => {
    const { selectorPage } = this.state;
    const { dispatch, plugins } = this.props;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const plugin = this.getPlugin(plugins, name);
    const {id: pluginId, config } = plugin;
    const multiSelectorHandle = this.getPluginConfigField(config, "multiSelectorHandle") === "1";
    this.setState({
      popup: (
        <Selector
          pluginId={pluginId}
          multiSelectorHandle={multiSelectorHandle}
          handleOk={selector => {
            dispatch({
              type: "common/addSelector",
              payload: { pluginId, ...selector },
              fetchValue: { pluginId, currentPage: selectorPage, pageSize: 12 },
              callback: () => {
                this.closeModal();
              }
            });
          }}
          onCancel={this.closeModal}
        />
      )
    });
  };

  searchRuleOnchange = e => {
    const ruleName = e.target.value;
    this.setState({ ruleName });
  };

  searchRule = () => {
    this.setState({ rulePage: 1 });
    this.getAllRules(1);
  }

  addRule = () => {
    const { rulePage,pluginId } = this.state;
    const { dispatch, currentSelector, plugins} = this.props;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const plugin = this.getPlugin(plugins, name);
    const { config } = plugin;
    const multiRuleHandle = this.getPluginConfigField(config, "multiRuleHandle") === "1";
    if (currentSelector && currentSelector.id) {
      const selectorId = currentSelector.id;
      this.setState({
        popup: (
          <Rule
            pluginId={pluginId}
            pluginName={name}
            multiRuleHandle={multiRuleHandle}
            handleOk={rule => {
              dispatch({
                type: "common/addRule",
                payload: { selectorId, ...rule },
                fetchValue: {
                  selectorId,
                  currentPage: rulePage,
                  pageSize: 12
                },
                callback: () => {
                  this.closeModal();
                }
              });
            }}
            onCancel={this.closeModal}
          />
        )
      });
    } else {
      message.destroy();
      message.warn(getIntlContent('SHENYU.COMMON.WARN.INPUT_SELECTOR'));
    }
  };

  editSelector = record => {
    const { dispatch, plugins } = this.props;
    const { selectorPage } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const plugin = this.getPlugin(plugins, name);
    const { id: pluginId, config } = plugin;
    const multiSelectorHandle = this.getPluginConfigField(config, "multiSelectorHandle") === "1";
    const { id } = record;
    dispatch({
      type: "common/fetchSeItem",
      payload: {
        id
      },
      callback: selector => {
        this.setState({
          popup: (
            <Selector
              {...selector}
              multiSelectorHandle={multiSelectorHandle}
              handleOk={values => {
                dispatch({
                  type: "common/updateSelector",
                  payload: {
                    pluginId,
                    ...values,
                    id
                  },
                  fetchValue: {
                    pluginId,
                    currentPage: selectorPage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                  }
                });
              }}
              onCancel={this.closeModal}
            />
          )
        });
      }
    });
  };

  deleteSelector = record => {
    const { dispatch, plugins } = this.props;
    const { selectorPage } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const pluginId = this.getPluginId(plugins, name);
    dispatch({
      type: "common/deleteSelector",
      payload: {
        list: [record.id]
      },
      fetchValue: {
        pluginId,
        currentPage: selectorPage,
        pageSize: 12
      }
    });
  };

  pageSelectorChange = page => {
    const { plugins } = this.props;
    this.setState({ selectorPage: page });
    this.getAllSelectors(page, plugins);
  };

  pageRuleChange = page => {
    this.setState({ rulePage: page });
    this.getAllRules(page);
  };

  // select
  rowClick = record => {
    const { id } = record;
    const { dispatch } = this.props;
    dispatch({
      type: "common/saveCurrentSelector",
      payload: {
        currentSelector: record
      }
    });
    dispatch({
      type: "common/fetchRule",
      payload: {
        currentPage: 1,
        pageSize: 12,
        selectorId: id
      }
    });
  };

  editRule = record => {
    const { dispatch, currentSelector, plugins } = this.props;
    const { rulePage,pluginId } = this.state;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const plugin = this.getPlugin(plugins, name)
    const { config } = plugin;
    const multiRuleHandle = this.getPluginConfigField(config, "multiRuleHandle") === "1";
    const selectorId = currentSelector ? currentSelector.id : "";
    const { id } = record;
    dispatch({
      type: "common/fetchRuleItem",
      payload: {
        id
      },
      callback: rule => {
        this.setState({
          popup: (
            <Rule
              {...rule}
              pluginId={pluginId}
              pluginName={name}
              multiRuleHandle={multiRuleHandle}
              handleOk={values => {
                dispatch({
                  type: "common/updateRule",
                  payload: {
                    selectorId,
                    ...values,
                    id
                  },
                  fetchValue: {
                    selectorId,
                    currentPage: rulePage,
                    pageSize: 12
                  },
                  callback: () => {
                    this.closeModal();
                  }
                });
              }}
              onCancel={this.closeModal}
            />
          )
        });
      }
    });
  };

  deleteRule = record => {
    const { dispatch, currentSelector } = this.props;
    const { rulePage } = this.state;
    dispatch({
      type: "common/deleteRule",
      payload: {
        list: [record.id]
      },
      fetchValue: {
        selectorId: currentSelector.id,
        currentPage: rulePage,
        pageSize: 12
      }
    });
  };

  asyncClick = () => {
    const { dispatch, plugins } = this.props;
    let name = this.props.match.params ? this.props.match.params.id : ''
    const id = this.getPluginId(plugins, name);
    dispatch({
      type: "global/asyncPlugin",
      payload: {
        id
      }
    });
  };

  changeLocales(locale) {
    this.setState({
      localeName: locale
    });
    getCurrentLocale(this.state.localeName);
  }

  render() {
    const { popup, selectorPage, rulePage } = this.state;
    const {
      selectorList,
      ruleList,
      selectorTotal,
      ruleTotal,
      currentSelector
    } = this.props;
    const name = this.props.match.params ? this.props.match.params.id : '';
    const selectColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME"),
        dataIndex: "name",
        key: "name"
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPEN"),
        dataIndex: "enabled",
        key: "enabled",
        render: text => {
          if (text) {
            return <div className="open">{getIntlContent("SHENYU.COMMON.OPEN")}</div>;
          } else {
            return <div className="close">{getIntlContent("SHENYU.COMMON.CLOSE")}</div>;
          }
        }
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms={`plugin:${name}Selector:edit`}>
                <span
                  style={{ marginRight: 8 }}
                  className="edit"
                  onClick={e => {
                    e.stopPropagation();
                    this.editSelector(record);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.CHANGE")}
                </span>
              </AuthButton>
              <AuthButton perms={`plugin:${name}Selector:delete`}>
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  placement='bottom'
                  onCancel={(e) => {
                    e.stopPropagation()
                  }}
                  onConfirm={(e) => {
                    e.stopPropagation()
                    this.deleteSelector(record);
                  }}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <span
                    className="edit"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                  </span>
                </Popconfirm>
              </AuthButton>
            </div>
          );
        }
      }
    ];

    const rulesColumns = [
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.RULE.NAME"),
        dataIndex: "name",
        key: "name"
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPEN"),
        dataIndex: "enabled",
        key: "enabled",
        render: text => {
          if (text) {
            return <div className="open">{getIntlContent("SHENYU.COMMON.OPEN")}</div>;
          } else {
            return <div className="close">{getIntlContent("SHENYU.COMMON.CLOSE")}</div>;
          }
        }
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME"),
        dataIndex: "dateCreated",
        key: "dateCreated",
        sorter: (a,b) => a.dateCreated > b.dateCreated ? 1 : -1,
      },
      {
        align: "center",
        title: getIntlContent("SHENYU.COMMON.OPERAT"),
        dataIndex: "operate",
        key: "operate",
        render: (text, record) => {
          return (
            <div>
              <AuthButton perms={`plugin:${name}Rule:edit`}>
                <span
                  className="edit"
                  style={{ marginRight: 8 }}
                  onClick={e => {
                    e.stopPropagation();
                    this.editRule(record);
                  }}
                >
                  {getIntlContent("SHENYU.COMMON.CHANGE")}
                </span>
              </AuthButton>
              <AuthButton perms={`plugin:${name}Rule:delete`}>
                <Popconfirm
                  title={getIntlContent("SHENYU.COMMON.DELETE")}
                  placement='bottom'
                  onCancel={(e) => {
                    e.stopPropagation()
                  }}
                  onConfirm={(e) => {
                    e.stopPropagation()
                    this.deleteRule(record);
                  }}
                  okText={getIntlContent("SHENYU.COMMON.SURE")}
                  cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                >
                  <span
                    className="edit"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                  </span>
                </Popconfirm>
              </AuthButton>
            </div>
          );
        }
      }
    ];

    return (
      <div className="plug-content-wrap">
        <Row gutter={20}>
          <Col span={8}>
            <div className="table-header">
              <h3>{getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.TITLE")}</h3>
              <div className={styles.headerSearch}>
                <AuthButton perms={`plugin:${name}Selector:query`}>
                  <Search
                    className={styles.search}
                    style={{maxWidth:"50%"}}
                    placeholder={getIntlContent("SHENYU.PLUGIN.SEARCH.SELECTOR.NAME")}
                    enterButton={getIntlContent("SHENYU.SYSTEM.SEARCH")}
                    size="default"
                    onChange={this.searchSelectorOnchange}
                    onSearch={this.searchSelector}
                  />
                </AuthButton>
                <AuthButton perms={`plugin:${name}Selector:add`}>
                  <Button type="primary" onClick={this.addSelector}>
                    {getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.ADD")}
                  </Button>
                </AuthButton>
              </div>
            </div>
            <Table
              size="small"
              onRow={record => {
                return {
                  onClick: () => {
                    this.rowClick(record);
                  }
                };
              }}
              style={{ marginTop: 30 }}
              bordered
              columns={selectColumns}
              dataSource={selectorList}
              pagination={{
                total: selectorTotal,
                current: selectorPage,
                pageSize: 12,
                onChange: this.pageSelectorChange
              }}
              rowClassName={item => {
                if (currentSelector && currentSelector.id === item.id) {
                  return "table-selected";
                } else {
                  return "";
                }
              }}
            />
          </Col>
          <Col span={16}>
            <div className="table-header">
              <div style={{ display: "flex" }}>
                <h3 style={{ marginRight: 30 }}>{getIntlContent("SHENYU.PLUGIN.SELECTOR.RULE.LIST")}</h3>
                <AuthButton perms={`plugin:${name }:modify`}>
                  <Button icon="reload" onClick={this.asyncClick} type="primary">
                    {getIntlContent("SHENYU.COMMON.SYN")} {name}
                  </Button>
                </AuthButton>
              </div>

              <div className={styles.headerSearch}>
                <AuthButton perms={`plugin:${name}Rule:query`}>
                  <Search
                    className={styles.search}
                    placeholder={getIntlContent("SHENYU.PLUGIN.SEARCH.RULE.NAME")}
                    enterButton={getIntlContent("SHENYU.SYSTEM.SEARCH")}
                    size="default"
                    onChange={this.searchRuleOnchange}
                    onSearch={this.searchRule}
                  />
                </AuthButton>
                <AuthButton perms={`plugin:${name}Rule:add`}>
                  <Button type="primary" onClick={this.addRule}>
                    {getIntlContent("SHENYU.COMMON.ADD.RULE")}
                  </Button>
                </AuthButton>
              </div>
            </div>
            <Table
              size="small"
              style={{ marginTop: 30 }}
              bordered
              columns={rulesColumns}
              expandedRowRender={record => <p style={{maxWidth:document.documentElement.clientWidth*0.5-50}}>{record.handle}</p>}
              dataSource={ruleList}
              pagination={{
                total: ruleTotal,
                current: rulePage,
                pageSize: 12,
                onChange: this.pageRuleChange
              }}
            />
          </Col>
        </Row>
        {popup}
      </div>
    );
  }
}
