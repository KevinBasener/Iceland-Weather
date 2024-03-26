import 'package:flutter/material.dart';
import 'persistent_bottom_bar_scaffold.dart';
import 'package:http/http.dart' as http;

class HomePage extends StatelessWidget {
  final _tab1navigatorKey = GlobalKey<NavigatorState>();
  final _tab2navigatorKey = GlobalKey<NavigatorState>();
  final _tab3navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return PersistentBottomBarScaffold(
      items: [
        PersistentTabItem(
          tab: WeatherTabPage(weatherType: 'wind'),
          icon: Icons.air,
          title: 'Wind',
          navigatorkey: _tab1navigatorKey,
        ),
        PersistentTabItem(
          tab: WeatherTabPage(weatherType: 'temperature'),
          icon: Icons.thermostat_outlined,
          title: 'Temperature',
          navigatorkey: _tab2navigatorKey,
        ),
        PersistentTabItem(
          tab: WeatherTabPage(weatherType: 'precipitation'),
          icon: Icons.invert_colors,
          title: 'Precipitation',
          navigatorkey: _tab3navigatorKey,
        ),
      ],
    );
  }
}

class WeatherTabPage extends StatelessWidget {
  final String weatherType;

  const WeatherTabPage({Key? key, required this.weatherType}) : super(key: key);

  Future<String> fetchWeatherImageUrl(String type) async {
    const String imageId = "1";
    final String apiUrl = 'http://10.0.2.2:8080/images/$type/$imageId';
    final response = await http.get(Uri.parse(apiUrl));

    if (response.statusCode == 200) {
      // Assuming the API returns the direct URL to the image
      return response.body; // You might need to decode JSON depending on your API response
    } else {
      throw Exception('Failed to load weather image');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(weatherType)),
      body: FutureBuilder<String>(
        future: fetchWeatherImageUrl(weatherType),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            if (snapshot.hasData) {
              return Center(
                child: Image.network(snapshot.data!),
              );
            } else if (snapshot.hasError) {
              return Text("${snapshot.error}");
            }
          }
          // By default, show a loading spinner.
          return const CircularProgressIndicator();
        },
      ),
    );
  }
}