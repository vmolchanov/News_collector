let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let fs = require("fs");
let request = require("request");
let cheerio = require("cheerio");

// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json 
app.use(bodyParser.json());

let templating = require("consolidate");
app.engine("hbs", templating.handlebars);
app.set("view engine", "hbs");
app.set("views", __dirname);


app.get("/", (req, res) => {
    res.render("index", (err, html) => res.send(html));
});

app.get("/*.css", (req, res) => {
    fs.readFile(req.params[0] + ".css", (err, data) => {
        if (err)
            throw err;

        res.set("Content-Type", "text/css");
        res.send(data);
    });
});

app.get("/news", (req, res) => {
    switch (req.query.site) {
        case "yandex":
            request("https://news.yandex.ru/sport.html", (error, response, body) => {
                let $ = cheerio.load(body);
                
                let newsTitle = $(".story .story__content .story__title a");
                let newsContent = $(".story .story__content .story__text");

                let news = [];

                for (let i = 0; i < newsContent.length; i++) {
                    news.push({
                        title: newsTitle[i].children[0].data,
                        content: newsContent[i].children[0].data
                    });
                }

                res.render("index", { news: news }, (err, html) => res.send(html));
            });
            break;

        case "mail":
            request("https://sport.mail.ru/", (error, response, body) => {
                let $ = cheerio.load(body);

                let newsTitle = $("article.topnews a.topnews__content__header__inner__link");
                let newsContent = $("article.topnews .topnews__content__text");

                let news = [];

                for (let i = 0; i < newsContent.length; i++) {
                    news.push({
                        title: newsTitle[i].children[0].data,
                        content: newsContent[i].children[0].data
                    });
                }

                res.render("index", { news: news }, (err, html) => res.send(html));
            });
            break;

        default:
            res.redirect("/");
    }
});

app.use((req, res, next) => {
    res.status(404).render("404", (err, html) => res.send(html));
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).send("Internal Server Error");
});

app.listen(8080, () => console.log("Server is listening.\nhttp://localhost:8080"));
