package com.kody.ho.controller;

import com.alibaba.fastjson.JSON;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.kody.ho.mapper.UserInfoMapper;
import com.kody.ho.entity.UserInfo;
import com.kody.ho.entity.UserInfoExample;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Created by shihaoli on 2017/9/16.
 */
@RestController
public class UserInfoController {
    @Autowired
    private UserInfoMapper UserInfoMapper;

    @RequestMapping("/find/mybatis/page")
    public String findUserPageFromMybatis(HttpServletRequest request, Integer pageNum, Integer pageSize) {
        pageNum = pageNum == null ? 1 : pageNum;
        pageSize = pageSize == null ? 10 : pageSize;
        PageHelper.startPage(pageNum, pageSize);
        List<UserInfo> list = UserInfoMapper.selectByExample(new UserInfoExample());
        PageInfo pageInfo = new PageInfo(list);
        Page page = (Page) list;
        return "PageInfo: " + JSON.toJSONString(pageInfo) + ", Page: " + JSON.toJSONString(page);
    }
}
