package com.kody.ho.service.impl;

import com.kody.ho.service.UserService;
import com.kody.ho.dao.UserDao;
import com.kody.ho.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


/**
 * Created by shihaoli on 2017/9/15.
 */
@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserDao  userDao;

    /**
     * 获取所有用户列表
     * @return
     */
    public List<User> getUserList(){
        List<User> userList=new ArrayList<User>();
        userList=userDao.findAll();
        return  userList;
    }
}
