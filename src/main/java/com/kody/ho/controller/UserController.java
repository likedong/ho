package com.kody.ho.controller;

import com.kody.ho.entity.User;
import com.kody.ho.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.propertyeditors.CustomDateEditor;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

/**
 * Created by shihaoli on 2017/9/15.
 */
@RestController
public class UserController {
    protected final Logger logger = LoggerFactory.getLogger(this.getClass());
    @Autowired
    private User user;

    @Resource
    private UserService userService;

    /**
     * 获取所有用户
     * @return
     */
    @GetMapping(value = "/getUserList")
    public List<User> getUserList() {
        try {
            System.out.print("ABCDEFG");

        }catch (Exception e){
             /*logger.trace("I am trace log.");
             logger.debug("I am debug log.");
             logger.warn("I am warn log.");
            logger.error("I am error log.");*/
        }

        return userService.getUserList();

    }
    @InitBinder
    protected void init(HttpServletRequest request, ServletRequestDataBinder binder) {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));/*TimeZone时区，解决差8小时的问题*/
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, false));
    }
}
