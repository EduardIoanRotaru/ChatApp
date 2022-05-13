using Microsoft.EntityFrameworkCore;

namespace API.DAL
{
    public class ChatDbContext : DbContext
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options)
            : base(options)
        {
        }

    }
}