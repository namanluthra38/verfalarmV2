package com.verf.ProdExp.exception;

import com.verf.ProdExp.api.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import java.time.Instant;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    protected ResponseEntity<Object> handleNotFound(ResourceNotFoundException ex, WebRequest request) {
        ApiError err = new ApiError(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage(), Instant.now(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(BadRequestException.class)
    protected ResponseEntity<Object> handleBadRequest(BadRequestException ex, WebRequest request) {
        ApiError err = new ApiError(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage(), Instant.now(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }

    // handle application-level authorization exceptions (explicit checks)
    @ExceptionHandler(AuthorizationDeniedException.class)
    protected ResponseEntity<Object> handleAuthorizationDenied(AuthorizationDeniedException ex, WebRequest request) {
        ApiError err = new ApiError(HttpStatus.FORBIDDEN.value(), "Forbidden", ex.getMessage(), Instant.now(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
    }

    // handle Spring Security AccessDeniedException (method/security layer)
    @ExceptionHandler(AccessDeniedException.class)
    protected ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        ApiError err = new ApiError(HttpStatus.FORBIDDEN.value(), "Forbidden", "Access is denied", Instant.now(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<Object> handleGeneric(Exception ex, WebRequest request) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        ApiError err = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error", "An unexpected error occurred", Instant.now(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        String details = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        ApiError err = new ApiError(status.value(), "Validation Failed", details, Instant.now(), request.getDescription(false));
        return ResponseEntity.status(status.value()).headers(headers).body(err);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        ApiError err = new ApiError(status.value(), "Malformed JSON", ex.getMessage(), Instant.now(), request.getDescription(false));
        return ResponseEntity.status(status.value()).headers(headers).body(err);
    }
}
