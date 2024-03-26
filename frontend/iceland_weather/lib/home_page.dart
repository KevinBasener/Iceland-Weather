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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(weatherType)),
      body: Container(
        color: Colors.deepPurple,
        child: InteractiveViewer(
          boundaryMargin: const EdgeInsets.all(double.infinity),
          panEnabled: true,
          minScale: 1.0,
          maxScale: 4.0,
          child: Center(
            child: Image.network('http://10.0.2.2:8080/images/$weatherType/1'),
          ),
        ),
      ),
    );
  }
}
