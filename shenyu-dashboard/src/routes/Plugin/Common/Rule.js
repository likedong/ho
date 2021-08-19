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
import { Modal, Form, Select, Input, Switch, Button, message } from "antd";
import { connect } from "dva";
import styles from "../index.less";
import { getIntlContent } from "../../../utils/IntlUtils"
import CommonRuleHandle from "./CommonRuleHandle";
import PluginRuleHandle from "../PluginRuleHandle"

const FormItem = Form.Item;
const { Option } = Select;

@connect(({pluginHandle, shenyuDict }) => ({
  pluginHandle,
  shenyuDict
}))
class AddModal extends Component {
  constructor(props) {
    super(props);

    const customPluginNames = Object.keys(PluginRuleHandle);
    this.state = {
      customRulePage: customPluginNames.includes(props.pluginName)
    };

    this.initRuleCondition(props);
    this.initDics();
  }

  componentWillMount() {
    const { dispatch,pluginId, handle, multiRuleHandle } = this.props;
    this.setState({pluginHandleList: []})
    let type = 2
    dispatch({
      type: "pluginHandle/fetchByPluginId",
      payload:{
        pluginId,
        type,
        handle,
        isHandleArray: multiRuleHandle,
        callBack: pluginHandles => {
          this.setPluginHandleList(pluginHandles);
        }
      }
    });
  }

  initRuleCondition = (props) => {
    const ruleConditions = props.ruleConditions || [
      {
        paramType: "uri",
        operator: "=",
        paramName: "/",
        paramValue: ""
      }
    ];
    ruleConditions.forEach((item, index) => {
      const { paramType } = item;
      let key = `paramTypeValueEn${index}`;
      if (paramType === "uri" || paramType === "host" || paramType === "ip") {
        this.state[key] = true;
        ruleConditions[index].paramName = "/";
      } else {
        this.state[key] = false;
      }
    });
    this.state.ruleConditions = ruleConditions;
  }

  initDics = () => {
    this.initDic("operator");
    this.initDic("matchMode");
    this.initDic("paramType");
  }

  initDic = (type) => {
    const { dispatch } = this.props;
    dispatch({
      type: "shenyuDict/fetchByType",
      payload:{
        type,
        callBack: dics => {
          this.state[`${type}Dics`] = dics
        }
      }
    });
  }

  setPluginHandleList = pluginHandles=>{
    this.setState({pluginHandleList: pluginHandles})
  }

  checkConditions = () => {
    let { ruleConditions } = this.state;
    let result = true;
    if (ruleConditions) {
      ruleConditions.forEach((item, index) => {
        const { paramType, operator, paramName, paramValue } = item;
        if (!paramType || !operator || !paramValue) {
          message.destroy();
          message.error(`Line ${index + 1} condition is incomplete`);
          result = false;
        }
        if (paramType === "uri" || paramType === "host" || paramType === "ip") {
          // aaa
        } else {
          // eslint-disable-next-line no-lonely-if
          if (!paramName) {
            message.destroy();
            message.error(`Line ${index + 1} condition is incomplete`);
            result = false;
          }
        }
      });
    } else {
      message.destroy();
      message.error(`Incomplete condition`);
      result = false;
    }

    return result;
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form, handleOk, multiRuleHandle } = this.props;
    const { ruleConditions, pluginHandleList, customRulePage } = this.state;

    form.validateFieldsAndScroll((err, values) => {
      const { name, matchMode, loged, enabled } = values;
      if (!err) {
        const submit = this.checkConditions();
        if (submit) {
          let handle;
          if(!customRulePage) {
            handle = [];
            pluginHandleList.forEach((handleList, index) => {
              handle[index] = {};
              handleList.forEach((item) => {
                handle[index][item.field] = values[item.field + index]
              });
            });
            handle = multiRuleHandle ? JSON.stringify(handle) : JSON.stringify(handle[0]) ;
          } else if(this.handleComponentRef){
            handle = this.handleComponentRef.getData(values);
          }

          handleOk({
            name,
            matchMode,
            handle,
            loged,
            enabled,
            sort: Number(values.sort),
            ruleConditions
          });
        }
      }
    });
  };

  handleAdd = () => {
    let { ruleConditions } = this.state;
    ruleConditions.push({
      paramType: "uri",
      operator: "=",
      paramName: "/",
      paramValue: ""
    });

    this.setState({ ruleConditions }, () => {
      let len = ruleConditions.length || 0;
      let key = `paramTypeValueEn${len - 1}`;
      this.setState({ [key]: true });
    });
  };

  handleDelete = index => {
    let { ruleConditions } = this.state;
    if (ruleConditions && ruleConditions.length > 1) {
      ruleConditions.splice(index, 1);
    } else {
      message.destroy();
      message.error("At least one condition");
    }
    this.setState({ ruleConditions });
  };

  handleAddHandle = () => {
    let {pluginHandleList} = this.state;
    let pluginHandle = pluginHandleList[0];
    let toAddPluginHandle = pluginHandle.map(e=>{
      return {...e,value:null};
    })
    pluginHandleList.push(toAddPluginHandle);
    this.setState({
      pluginHandleList
    })
  }

  handleDeleteHandle = (index) => {
    let {pluginHandleList} = this.state;
    if(pluginHandleList.length === 1) {
      message.destroy();
      message.error(getIntlContent("SHENYU.PLUGIN.HANDLE.TIP"));
    } else {
      pluginHandleList.splice(index,1);
      this.setState({pluginHandleList})
    }
  }

  conditionChange = (index, name, value) => {
    let { ruleConditions } = this.state;
    ruleConditions[index][name] = value;
    if (name === "paramType") {
      let key = `paramTypeValueEn${index}`;
      if (value === "uri" || value === "host" || value === "ip") {
        this.setState({ [key]: true });
        ruleConditions[index].paramName = "/";
      } else {
        this.setState({ [key]: false });
      }
    }

    this.setState({ ruleConditions });
  };

  render() {
    let {
      onCancel,
      form,
      name = "",
      matchMode = "",
      loged = true,
      enabled = true,
      sort = "",
      multiRuleHandle,
      pluginName,
      handle,
    } = this.props;
    const { ruleConditions,pluginHandleList, operatorDics, matchModeDics, paramTypeDics, customRulePage } = this.state;

    let RuleHandleComponent;
    if(customRulePage) {
      RuleHandleComponent = PluginRuleHandle[pluginName]
    } else if(pluginHandleList && pluginHandleList.length > 0) {
      RuleHandleComponent = CommonRuleHandle;
    }

    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        sm: { span: 3 }
      },
      wrapperCol: {
        sm: { span: 21 }
      }
    };
    const formCheckLayout = {
      labelCol: {
        sm: { span: 18 }
      },
      wrapperCol: {
        sm: { span: 4 }
      }
    };
    return (
      <Modal
        width={1000}
        centered
        title={getIntlContent("SHENYU.RULE.NAME")}
        visible
        okText={getIntlContent("SHENYU.COMMON.SURE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        onOk={this.handleSubmit}
        onCancel={onCancel}
      >
        <Form onSubmit={this.handleSubmit} className="login-form">
          <FormItem label={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} {...formItemLayout}>
            {getFieldDecorator("name", {
              rules: [{ required: true, message: getIntlContent("SHENYU.COMMON.INPUTNAME") }],
              initialValue: name
            })(<Input placeholder={getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME")} />)}
          </FormItem>
          <FormItem label={getIntlContent("SHENYU.COMMON.MATCHTYPE")} {...formItemLayout}>
            {getFieldDecorator("matchMode", {
              rules: [{ required: true, message: getIntlContent("SHENYU.COMMON.INPUTMATCHTYPE") }],
              initialValue: `${matchMode}`
            })(
              <Select>
                {matchModeDics&&matchModeDics.map(item => {
                  return (
                    <Option
                      key={item.dictValue}
                      value={item.dictValue}
                    >
                      {item.dictName}
                    </Option>
                  );
                })}
              </Select>
            )}
          </FormItem>
          <div className={styles.ruleConditions}>
            <h3 className={styles.header} style={{width:105}}>
              <strong>*</strong>{getIntlContent("SHENYU.COMMON.CONDITION")}:
            </h3>
            <div className={styles.content}>
              {ruleConditions.map((item, index) => {
                return (
                  <ul key={index}>
                    <li>
                      <Select
                        onChange={value => {
                          this.conditionChange(index, "paramType", value);
                        }}
                        value={item.paramType}
                        style={{ width: 120 }}
                      >
                        {paramTypeDics&&paramTypeDics.map(type => {
                          return (
                            <Option key={type.dictValue} value={type.dictValue}>
                              {type.dictName}
                            </Option>
                          );
                        })}
                      </Select>
                    </li>
                    <li
                      style={{
                        display: this.state[`paramTypeValueEn${index}`]
                          ? "none"
                          : "block"
                      }}
                    >
                      <Input
                        onChange={e => {
                          this.conditionChange(
                            index,
                            "paramName",
                            e.target.value
                          );
                        }}
                        value={item.paramName}
                        style={{ width: 100 }}
                      />
                    </li>
                    <li>
                      <Select
                        onChange={value => {
                          this.conditionChange(index, "operator", value);
                        }}
                        value={item.operator}
                        style={{ width: 150 }}
                      >
                        {operatorDics&&operatorDics.map(opearte => {
                          return (
                            <Option key={opearte.dictValue} value={opearte.dictValue}>
                              {opearte.dictName}
                            </Option>
                          );
                        })}
                      </Select>
                    </li>

                    <li>
                      <Input
                        onChange={e => {
                          this.conditionChange(
                            index,
                            "paramValue",
                            e.target.value
                          );
                        }}
                        value={item.paramValue}
                        style={{ width: 280 }}
                      />
                    </li>
                    <li>
                      <Button
                        type="danger"
                        onClick={() => {
                          this.handleDelete(index);
                        }}
                      >
                        {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                      </Button>
                    </li>
                  </ul>
                );
              })}
            </div>
            <div>
              <Button onClick={this.handleAdd} type="primary">
                {getIntlContent("SHENYU.COMMON.ADD")}
              </Button>
            </div>
          </div>
          {RuleHandleComponent&&(
            <RuleHandleComponent
              onRef={handleComponentRef=>{
                this.handleComponentRef = handleComponentRef
              }}
              form={form}
              pluginHandleList={pluginHandleList}
              handle={handle}
              multiRuleHandle={multiRuleHandle}
            />
          )}
          <div className={styles.layout}>
            <FormItem
              style={{ margin: "0 30px" }}
              {...formCheckLayout}
              label={getIntlContent("SHENYU.SELECTOR.PRINTLOG")}
            >
              {getFieldDecorator("loged", {
                initialValue: loged,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
            <FormItem {...formCheckLayout} label={getIntlContent("SHENYU.SELECTOR.WHETHEROPEN")}>
              {getFieldDecorator("enabled", {
                initialValue: enabled,
                valuePropName: "checked",
                rules: [{ required: true }]
              })(<Switch />)}
            </FormItem>
          </div>

          <FormItem label={getIntlContent("SHENYU.SELECTOR.EXEORDER")} {...formItemLayout}>
            {getFieldDecorator("sort", {
              initialValue: sort,
              rules: [
                {
                  required: true,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                },
                {
                  pattern: /^([1-9][0-9]{0,1}|100)$/,
                  message: getIntlContent("SHENYU.SELECTOR.INPUTNUMBER")
                }
              ]
            })(<Input placeholder={getIntlContent("SHENYU.SELECTOR.INPUTORDER")} />)}
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(AddModal);
