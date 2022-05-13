using API.Hubs;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.SignalR;

[EnableCors("CorsPolicy")]
public class ChatHub : Hub
{
    private readonly static ConnectionMapping<string> _connections =
            new ConnectionMapping<string>();

    private readonly IHttpContextAccessor _httpContextAccessor;

    public ChatHub(
        IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("SendMessage", user, message);
    }

    public async Task SendMessageToUser(string receiverName, string receiverConnectionId, string senderConnectionId, string privateMessage, string senderName)
    {
        await Clients.Client(receiverConnectionId).SendAsync("SendMessageToUser", receiverName, receiverConnectionId, senderConnectionId, privateMessage, senderName);
    }

    public override async Task OnConnectedAsync()
    {
        var username = string.Empty;

        var tokenValid = (bool)_httpContextAccessor.HttpContext.Items["tokenIsValid"];

        if (tokenValid)
        {
            username = _httpContextAccessor.HttpContext.Items["username"].ToString();
        }
        else
        {
            var rand = new Random();
            var number = rand.Next(1, 10);

            username = "bob" + number;
            _httpContextAccessor.HttpContext.Items["username"] = username;
        }

        _connections.Add(username, Context.ConnectionId);

        await Clients.Caller.SendAsync("GetYourUsername", username);
        await Clients.All.SendAsync("UpdateConnectionsList", _connections.GetAllActiveConnections());
    }

    public override async Task OnDisconnectedAsync(Exception ex)
    {
        var username = _httpContextAccessor.HttpContext.Items["username"].ToString();

        _connections.Remove(username, Context.ConnectionId);

        await Clients.All.SendAsync("UpdateConnectionsList", _connections.GetAllActiveConnections());
    }

    public async Task GetConnectionId()
    {
        await Clients.Caller.SendAsync("GetConnectionId", Context.ConnectionId);
    }

    // public IEnumerable<string> GetAllActiveConnections()
    // {
    //     return _connections.GetConnections("bob");
    // }
}