using API.Hubs;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.SignalR;
using API.Helpers;
using API.Models.DTO;
using System.Drawing;
using API.DAL;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

[EnableCors("CorsPolicy")]
public class ChatHub : Hub
{
    private readonly static ConnectionMapping<string> _connections =
            new ConnectionMapping<string>();

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserDbContext _context;
    private readonly IMapper _mapper;

    public ChatHub(
        IHttpContextAccessor httpContextAccessor, UserDbContext context, IMapper mapper)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
        _mapper = mapper;
    }

    public async Task SendMessage(string user, string photoUrl, string message)
    {
        await Clients.All.SendAsync("SendMessage", user, photoUrl, message);
    }

    public async Task SendMessageToUser(string receiverName, string receiverConnectionId, string senderConnectionId, string privateMessage, string senderName)
    {
        await Clients.Client(receiverConnectionId).SendAsync("SendMessageToUser", receiverName, receiverConnectionId, senderConnectionId, privateMessage, senderName);
    }

    public override async Task OnConnectedAsync()
    {
        var username = string.Empty;
        var randomPhoto = string.Empty;

        UserProfileDto userprofile = new UserProfileDto();

        var tokenValid = (bool)_httpContextAccessor.HttpContext.Items["tokenIsValid"];

        if (tokenValid)
        {
            var userId = int.TryParse(_httpContextAccessor.HttpContext.Items["id"].ToString(), out int id);

            var user = await _context.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);

            if (user != null) userprofile.Id = id;

            if (username == null)
            {
                username = await RandomUsername();
                user.Name = username;
            }

            if (randomPhoto == null)
            {
                randomPhoto = await RandomPhoto();
                user.PhotoUrl = randomPhoto;
            }

            _context.Attach(user);
            _context.Entry(user).State = EntityState.Modified;

            if (await _context.SaveChangesAsync() > 0)
            {
                userprofile.ImagePublicId = user.PublicId;
                userprofile.Name = user.Name;
                userprofile.PhotoUrl = user.PhotoUrl;
            }
        }
        else
        {
            username = await RandomUsername();
            randomPhoto = await RandomPhoto();

            userprofile.Name = username;
            userprofile.PhotoUrl = randomPhoto;
        }

        _httpContextAccessor.HttpContext.Items["username"] = username;

        _connections.Add(username, Context.ConnectionId);

        await Clients.Caller.SendAsync("GetYourUsername", userprofile);
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

    private async Task<string> RandomUsername()
    {
        var listNames = (await JsonFileReader.ReadAsync<RandomName[]>(@"assets\names.json"));
        var random = listNames.PickRandom();

        while (_connections.KeyExists(random.Name))
        {
            random = listNames.PickRandom();
        }

        return await Task.FromResult(random.Name);
    }

    private async Task<string> RandomPhoto()
    {
        var listPhotos = (await JsonFileReader.ReadAsync<RandomName[]>(@"assets\imagesName.json"));

        return await Task.FromResult(listPhotos.PickRandom().Name);
    }
}