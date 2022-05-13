
using API.Models.DTO;
using API.Models.Entities;

namespace API.Models.Contracts
{
    public interface IAuthService
    {
        Task<UserLoginDto> Login(string username, string password);
        Task<UserRegisterDto> Register(User user, string password);
        Task<bool> UserExists(string username);
        Task<User> GetById(int id);
         string GetUsernameFromClientToken(string token);
    }
}