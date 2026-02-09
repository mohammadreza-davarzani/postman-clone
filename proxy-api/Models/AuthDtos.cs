namespace ProxyApi.Models;

public record RegisterRequest(string Email, string Password, string Name);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, string Email, string Name);
