using System.Text;

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
                "https://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

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
