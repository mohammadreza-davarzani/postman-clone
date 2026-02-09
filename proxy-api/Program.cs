using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProxyApi.Data;
using ProxyApi.Models;
using ProxyApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "http://127.0.0.1:3000",
                "https://127.0.0.1:3000",
                "http://localhost:5173",
                "https://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Database (MySQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Services
builder.Services.AddScoped<AuthService>();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-min-32-chars-long-12345";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PostmanClone";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PostmanCloneUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// HttpClient for forwarding requests (no redirect following for accurate status codes)
builder.Services.AddHttpClient("Proxy")
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        AllowAutoRedirect = false,
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Auth endpoints
app.MapPost("/api/auth/register", async (RegisterRequest request, AuthService authService) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required." });

    if (request.Password.Length < 6)
        return Results.BadRequest(new { error = "Password must be at least 6 characters long." });

    var result = await authService.RegisterAsync(request);
    if (result == null)
        return Results.BadRequest(new { error = "User with this email already exists." });

    return Results.Ok(result);
})
.WithName("Register")
.Produces<AuthResponse>(200)
.Produces(400);

app.MapPost("/api/auth/login", async (LoginRequest request, AuthService authService) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        return Results.BadRequest(new { error = "Email and password are required." });

    var result = await authService.LoginAsync(request);
    if (result == null)
        return Results.Unauthorized();

    return Results.Ok(result);
})
.WithName("Login")
.Produces<AuthResponse>(200)
.Produces(401);

app.MapGet("/api/auth/me", (System.Security.Claims.ClaimsPrincipal user) =>
{
    var email = user.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
    var name = user.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
    var userId = user.FindFirst("userId")?.Value;

    if (email == null || name == null)
        return Results.Unauthorized();

    return Results.Ok(new { email, name, userId });
})
.WithName("GetCurrentUser")
.RequireAuthorization()
.Produces(200)
.Produces(401);

// Collection endpoints
app.MapGet("/api/collections", async (System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var collections = await db.Collections
        .Where(c => c.UserId == userId)
        .OrderBy(c => c.CreatedAt)
        .ToListAsync();

    var result = collections.Select(c => new CollectionDto(
        c.Id,
        c.Name,
        System.Text.Json.JsonSerializer.Deserialize<object>(c.ItemsJson) ?? new { },
        c.CreatedAt,
        c.UpdatedAt
    )).ToList();

    return Results.Ok(result);
})
.WithName("GetCollections")
.RequireAuthorization();

app.MapPost("/api/collections", async (CreateCollectionRequest request, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    
    var collection = new Collection
    {
        Name = request.Name,
        ItemsJson = System.Text.Json.JsonSerializer.Serialize(request.Items),
        UserId = userId
    };

    db.Collections.Add(collection);
    await db.SaveChangesAsync();

    var result = new CollectionDto(
        collection.Id,
        collection.Name,
        request.Items,
        collection.CreatedAt,
        collection.UpdatedAt
    );

    return Results.Ok(result);
})
.WithName("CreateCollection")
.RequireAuthorization();

app.MapPut("/api/collections/{id}", async (int id, UpdateCollectionRequest request, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    
    if (collection == null)
        return Results.NotFound();

    collection.Name = request.Name;
    collection.ItemsJson = System.Text.Json.JsonSerializer.Serialize(request.Items);
    collection.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    var result = new CollectionDto(
        collection.Id,
        collection.Name,
        request.Items,
        collection.CreatedAt,
        collection.UpdatedAt
    );

    return Results.Ok(result);
})
.WithName("UpdateCollection")
.RequireAuthorization();

app.MapDelete("/api/collections/{id}", async (int id, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var collection = await db.Collections.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    
    if (collection == null)
        return Results.NotFound();

    db.Collections.Remove(collection);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Collection deleted" });
})
.WithName("DeleteCollection")
.RequireAuthorization();

// Environment endpoints
app.MapGet("/api/environments", async (System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var environments = await db.Environments
        .Where(e => e.UserId == userId)
        .OrderBy(e => e.CreatedAt)
        .ToListAsync();

    var result = environments.Select(e => new EnvironmentDto(
        e.Id,
        e.Name,
        System.Text.Json.JsonSerializer.Deserialize<object>(e.VariablesJson) ?? new { },
        e.CreatedAt,
        e.UpdatedAt
    )).ToList();

    return Results.Ok(result);
})
.WithName("GetEnvironments")
.RequireAuthorization();

app.MapPost("/api/environments", async (CreateEnvironmentRequest request, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    
    var environment = new ProxyApi.Models.Environment
    {
        Name = request.Name,
        VariablesJson = System.Text.Json.JsonSerializer.Serialize(request.Variables),
        UserId = userId
    };

    db.Environments.Add(environment);
    await db.SaveChangesAsync();

    var result = new EnvironmentDto(
        environment.Id,
        environment.Name,
        request.Variables,
        environment.CreatedAt,
        environment.UpdatedAt
    );

    return Results.Ok(result);
})
.WithName("CreateEnvironment")
.RequireAuthorization();

app.MapPut("/api/environments/{id}", async (int id, UpdateEnvironmentRequest request, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var environment = await db.Environments.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
    
    if (environment == null)
        return Results.NotFound();

    environment.Name = request.Name;
    environment.VariablesJson = System.Text.Json.JsonSerializer.Serialize(request.Variables);
    environment.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    var result = new EnvironmentDto(
        environment.Id,
        environment.Name,
        request.Variables,
        environment.CreatedAt,
        environment.UpdatedAt
    );

    return Results.Ok(result);
})
.WithName("UpdateEnvironment")
.RequireAuthorization();

app.MapDelete("/api/environments/{id}", async (int id, System.Security.Claims.ClaimsPrincipal user, AppDbContext db) =>
{
    var userId = int.Parse(user.FindFirst("userId")?.Value ?? "0");
    var environment = await db.Environments.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
    
    if (environment == null)
        return Results.NotFound();

    db.Environments.Remove(environment);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Environment deleted" });
})
.WithName("DeleteEnvironment")
.RequireAuthorization();

// Proxy request body model
app.MapPost("/api/proxy", async (
    ProxyRequest request,
    IHttpClientFactory clientFactory,
    CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(request.Url))
        return Results.BadRequest(new { error = "URL is required." });

    if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri) || !uri.Scheme.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        return Results.BadRequest(new { error = "Invalid URL." });

    var client = clientFactory.CreateClient("Proxy");
    var req = new HttpRequestMessage(new HttpMethod(request.Method ?? "GET"), uri);

    var headersDict = request.Headers ?? new Dictionary<string, string>();

    foreach (var (key, value) in headersDict)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Equals("Host", StringComparison.OrdinalIgnoreCase)) continue;
        try
        {
            req.Headers.TryAddWithoutValidation(key, value);
        }
        catch
        {
            req.Content ??= new StringContent("", Encoding.UTF8, "application/octet-stream");
            req.Content.Headers.TryAddWithoutValidation(key, value);
        }
    }

    if (!string.IsNullOrEmpty(request.Body) && request.Method is "POST" or "PUT" or "PATCH")
    {
        var contentType = headersDict.TryGetValue("Content-Type", out var contentTypeVal) && !string.IsNullOrWhiteSpace(contentTypeVal)
            ? contentTypeVal
            : "application/json";
        req.Content = new StringContent(request.Body, Encoding.UTF8, contentType);
    }

    HttpResponseMessage res;
    try
    {
        res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
    }
    catch (HttpRequestException ex)
    {
        return Results.Json(new ProxyErrorResponse(
            0,
            "Error",
            new Dictionary<string, string>(),
            new { error = ex.Message }
        ), statusCode: 502);
    }

    var responseHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    foreach (var (key, value) in res.Headers)
        responseHeaders[key] = string.Join(", ", value);
    if (res.Content.Headers is { } ch)
    {
        foreach (var (key, value) in ch)
            responseHeaders[key] = string.Join(", ", value);
    }

    var raw = await res.Content.ReadAsStringAsync(ct);
    object data;
    var contentTypeHeader = res.Content.Headers.ContentType?.MediaType ?? "";
    if (contentTypeHeader.Contains("application/json", StringComparison.OrdinalIgnoreCase))
    {
        try
        {
            data = System.Text.Json.JsonSerializer.Deserialize<object>(raw) ?? raw;
        }
        catch
        {
            data = raw;
        }
    }
    else
    {
        data = raw;
    }

    return Results.Json(new ProxySuccessResponse(
        (int)res.StatusCode,
        res.ReasonPhrase ?? "",
        responseHeaders,
        data
    ));
})
.WithName("Proxy")
.Produces(200);

app.Run();

// DTOs (headers as object: { "Content-Type": "application/json", ... })
public record ProxyRequest(
    string? Method,
    string Url,
    Dictionary<string, string>? Headers,
    string? Body
);

public record ProxySuccessResponse(
    int Status,
    string StatusText,
    Dictionary<string, string> Headers,
    object Data
);

public record ProxyErrorResponse(
    int Status,
    string StatusText,
    Dictionary<string, string> Headers,
    object Data
);
