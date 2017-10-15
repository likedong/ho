package com.kody.ho.dao;


import com.kody.ho.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Created by shihaoli on 2017/9/15.
 */
public interface UserDao extends JpaRepository<User, Long> {

    /*User findByName(String username);*/
   /* User findByNameAndAge(String username, Integer age);*/

   /* @Query("from User u where u.username=:username")
    User findUser(@Param("username") String username);*/
}
