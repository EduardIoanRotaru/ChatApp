using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using API.Models.Contracts;
using API.Models.DTO;
using API.Models.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace API.Controllers
{
    [EnableCors("CorsPolicy")] 
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;

        public AuthController(IAuthService authService, IConfiguration config, IMapper mapper)
        {
            this._authService = authService;
            this._config = config;
            _mapper = mapper;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDto userForRegisterDto)
        {
            // validate request

            userForRegisterDto.Username = userForRegisterDto.Username.ToLower();

            if (await _authService.UserExists(userForRegisterDto.Username))
                return BadRequest("Username already exists");

            var newUser = new User
            {
                Username = userForRegisterDto.Username,
                Email = userForRegisterDto.Email,
            };

            var createdUser = await _authService.Register(newUser, userForRegisterDto.Password);

            return StatusCode(201);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDto userForLoginDto)
        {
            var user = await _authService.Login(userForLoginDto.Username, userForLoginDto.Password);

            if (user == null)
                return Unauthorized();

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config.GetSection("AppSettings:Secret").Value));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1),
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new
            {
                token = tokenHandler.WriteToken(token)
            });
        }

        [HttpPost("getusername")]
        public IActionResult GetUsername([FromBody] string token)
        {
            // if(token != null) {
            //     return Ok(_authService.GetUsernameFromClientToken(token));
            // }

            return Ok();
        }

        [HttpPost("validateToken")]
        public IActionResult ValidateToken([FromBody] string token)
        {
            var validToken = HttpContext.Items["tokenIsValid"];

            return Ok(validToken);
        }
    }
}