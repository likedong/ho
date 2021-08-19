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
import { Form, Select, Input, Button, Tooltip, Popconfirm } from "antd";
import classnames from 'classnames';
import styles from "../index.less";
import { getIntlContent } from '../../../utils/IntlUtils'

const FormItem = Form.Item;
const { Option } = Select;

export default class CommonRuleHandle extends Component {

    render() {
        const labelWidth = 160
        const { pluginHandleList, multiRuleHandle, form } = this.props;
        const { getFieldDecorator } = form;
        return (
          <div className={styles.handleWrap}>
            <div className={styles.header}>
              <h3 style={{width:100}}>{getIntlContent("SHENYU.COMMON.DEAL")}: </h3>
            </div>
            <div>
              {
                pluginHandleList.map((handleList,index) =>{
                    return (
                      <div key={index} style={{display:"flex",justifyContent:"space-between",flexDirection:"row"}}>
                        <ul
                          className={classnames({
                            [styles.handleUl]: true,
                            [styles.springUl]: true
                            })}
                          style={{width:"100%"}}
                        >
                          {handleList.map(item=> {
                            let required = item.required === "1";
                            let defaultValue =  (item.value === 0 || item.value === false) ? item.value:
                            (item.value ||
                                (item.defaultValue === "true"?true:(item.defaultValue === "false" ? false : item.defaultValue))
                            );
                            let placeholder = item.placeholder || item.label;
                            let checkRule = item.checkRule;
                            let fieldName = item.field+index;
                            let rules = [];
                            if(required){
                                rules.push({ required: {required}, message: getIntlContent("SHENYU.COMMON.PLEASEINPUT") + item.label});
                            }
                            if(checkRule){
                                rules.push({
                                // eslint-disable-next-line no-eval
                                pattern: eval(checkRule),
                                message: `${getIntlContent("SHENYU.PLUGIN.RULE.INVALID")}:(${checkRule})`
                                })
                            }
                            if (item.dataType === 1) {
                                return (
                                  <li key={fieldName}>
                                    <Tooltip title={placeholder}>
                                      <FormItem>
                                        {getFieldDecorator(fieldName, {
                                        rules,
                                        initialValue: defaultValue,
                                        })(
                                          <Input
                                            addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                            placeholder={placeholder}
                                            key={fieldName}
                                            type="number"
                                          />)
                                        }
                                      </FormItem>
                                    </Tooltip>
                                  </li>
                                )
                            } else if (item.dataType === 3 && item.dictOptions) {
                                return (
                                  <li key={fieldName}>
                                    <Tooltip title={placeholder}>
                                      <FormItem>
                                        {getFieldDecorator(fieldName, {
                                          rules,
                                          initialValue: defaultValue,
                                        })(
                                          <Select
                                            placeholder={placeholder}
                                            style={{ width: 260}}
                                          >
                                            {item.dictOptions.map(option => {
                                            return (
                                              <Option key={option.dictValue} value={option.dictValue==="true"?true:(option.dictValue==="false"?false:option.dictValue)}>
                                                {option.dictName} ({item.label})
                                              </Option>
                                            );
                                            })}
                                          </Select>
                                        )}
                                      </FormItem>
                                    </Tooltip>
                                  </li>
                                )
                            } else {
                                return (
                                  <li key={fieldName}>
                                    <Tooltip title={placeholder}>
                                      <FormItem>
                                        {getFieldDecorator(fieldName, {
                                        rules,
                                        initialValue: defaultValue,
                                        })(
                                          <Input
                                            addonBefore={<div style={{width: labelWidth}}>{item.label}</div>}
                                            placeholder={placeholder}
                                            key={fieldName}
                                          />
                                        )}
                                      </FormItem>
                                    </Tooltip>
                                  </li>
                                )
                            }
                            })}
                        </ul>
                        {multiRuleHandle && (
                          <div style={{width:80}}>
                            <Popconfirm
                              title={getIntlContent("SHENYU.COMMON.DELETE")}
                              placement='bottom'
                              onCancel={(e) => {
                                e.stopPropagation()
                              }}
                              onConfirm={(e) => {
                                e.stopPropagation()
                                this.handleDeleteHandle(index);
                              }}
                              okText={getIntlContent("SHENYU.COMMON.SURE")}
                              cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
                            >
                              <Button
                                type="danger"
                              >
                                {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                              </Button>
                            </Popconfirm>
                          </div>
                        )}
                      </div>
                    )
                 })
              }
            </div>
            {multiRuleHandle &&<div style={{width:80}}><Button onClick={this.handleAddHandle} type="primary">{getIntlContent("SHENYU.COMMON.ADD")}</Button></div>}
          </div>
        );
    }
}
