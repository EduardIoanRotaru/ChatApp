using System.Net;
using API.Helpers;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.CorsServicesExtensions();
builder.Services.DatabaseContextExtensions(builder.Configuration);
builder.Services.ApplicationExtensions(builder.Configuration);
builder.Services.AuthenticationExtentions(builder.Configuration);

builder.Services.AddCors(options => options.AddPolicy("CorsPolicy",
        builder =>
        {
            builder.AllowAnyHeader()
                   .AllowAnyMethod()
                   .SetIsOriginAllowed((host) => true)
                   .AllowCredentials();
        }));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.Use(async (context, next) =>
// {
//     await next();

//     if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value))
//     {
//         context.Request.Path = "/index.html";
//         await next();
//     }
// });

// app.UseDefaultFiles();
// app.UseStaticFiles();

app.UseExceptionHandler(builder =>
{
    builder.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var error = context.Features.Get<IExceptionHandlerFeature>();
        if (error != null)
        {
            context.Response.AddApplicationError(error.Error.Message);
            await context.Response.WriteAsync(error.Error.Message);
        }
    });
});

app.UseRouting();

app.UseHttpsRedirection();  
app.UseCors("CorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    app.MapControllers();
    endpoints.MapHub<ChatHub>("chathub");
});

app.Run();