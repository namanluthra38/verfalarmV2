package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;
import com.verf.ProdExp.dto.UpdateUserRequest;

public interface UserService {

    UserResponse register(RegisterRequest request);

    UserResponse getById(String id);

    UserResponse update(String id, UpdateUserRequest request);

    void delete(String id);

}
