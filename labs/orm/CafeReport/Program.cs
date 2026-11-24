using Dapper;
using Npgsql;

if (args.Length != 2 || args[0] is not ("ado" or "dapper"))
{
    Console.Error.WriteLine("Brug: CafeReport <ado|dapper> <by>");
    return 2;
}

var connectionString = Environment.GetEnvironmentVariable("CODEFIRST_CONNECTION_STRING")
    ?? throw new InvalidOperationException("Angiv CODEFIRST_CONNECTION_STRING.");
await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();

// De seks cafékunder fra SQL-forløbet. Tabellen tilhører kun denne forbindelse.
await using (var prepare = new NpgsqlCommand("""
    CREATE TEMP TABLE cafe_customers (id integer, name text, city text, email text);
    INSERT INTO cafe_customers VALUES
        (1, 'Anna Jensen', 'Viborg', 'anna@example.com'),
        (2, 'Bo Nielsen', 'Aarhus', 'bo@example.com'),
        (3, 'Clara Holm', 'Viborg', NULL),
        (4, 'David Lund', 'Aalborg', 'david@example.com'),
        (5, 'Eva Mikkelsen', 'Aarhus', 'eva@example.com'),
        (6, 'Freja Olsen', 'Viborg', 'freja@example.com');
    """, connection))
{
    await prepare.ExecuteNonQueryAsync();
}

const string report = """
    SELECT id AS "Id", name AS "Name", email AS "Email"
    FROM cafe_customers
    WHERE city = @city
    ORDER BY name;
    """;

var city = args[1];
IEnumerable<Customer> customers = args[0] == "ado"
    ? await ReadWithAdo(connection, report, city)
    : await connection.QueryAsync<Customer>(report, new { city });

var count = 0;
foreach (var customer in customers)
{
    Console.WriteLine($"{customer.Id} | {customer.Name} | {customer.Email ?? "(ingen e-mail)"}");
    count++;
}
Console.WriteLine($"{count} kunder i {city}");
return 0;

static async Task<List<Customer>> ReadWithAdo(NpgsqlConnection connection, string sql, string city)
{
    await using var command = new NpgsqlCommand(sql, connection);
    command.Parameters.AddWithValue("city", city);
    await using var reader = await command.ExecuteReaderAsync();
    var customers = new List<Customer>();
    while (await reader.ReadAsync())
    {
        var email = reader.IsDBNull(2) ? null : reader.GetString(2);
        customers.Add(new Customer(reader.GetInt32(0), reader.GetString(1), email));
    }
    return customers;
}

internal sealed record Customer(int Id, string Name, string? Email);
