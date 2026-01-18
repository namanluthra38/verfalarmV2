package com.verf.ProdExp.service;

import com.verf.ProdExp.dto.RegisterRequest;
import com.verf.ProdExp.dto.UserResponse;
import com.verf.ProdExp.dto.UpdateUserRequest;
import com.verf.ProdExp.dto.UpdateEmailRequest;
import com.verf.ProdExp.dto.UpdatePasswordRequest;
import com.verf.ProdExp.dto.UpdateDisplayNameRequest;

public interface UserService {

    UserResponse register(RegisterRequest request);

    UserResponse getById(String id);

    UserResponse update(String id, UpdateUserRequest request);

    void delete(String id);

    // New methods for field-specific updates
    UserResponse updateEmail(String id, UpdateEmailRequest request);

    void updatePassword(String id, UpdatePasswordRequest request);

    UserResponse updateDisplayName(String id, UpdateDisplayNameRequest request);

}
