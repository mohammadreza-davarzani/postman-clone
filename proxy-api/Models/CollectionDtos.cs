namespace ProxyApi.Models;

public record CollectionDto(
    int Id,
    string Name,
    object Items,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateCollectionRequest(
    string Name,
    object Items
);

public record UpdateCollectionRequest(
    string Name,
    object Items
);

public record EnvironmentDto(
    int Id,
    string Name,
    object Variables,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateEnvironmentRequest(
    string Name,
    object Variables
);

public record UpdateEnvironmentRequest(
    string Name,
    object Variables
);
