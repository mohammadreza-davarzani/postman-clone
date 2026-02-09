using System.Text.Json;

namespace ProxyApi.Models;

public class Collection
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string ItemsJson { get; set; } // JSON string of items
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Environment
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string VariablesJson { get; set; } // JSON string of variables
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
