package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;

public interface UserService {

    UserResponse register(RegisterRequest request);

}
