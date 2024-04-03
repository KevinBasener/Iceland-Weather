import 'package:intl/intl.dart';
import 'package:syncfusion_flutter_sliders/sliders.dart';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'persistent_bottom_bar_scaffold.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_blurhash/flutter_blurhash.dart';

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

class WeatherTabPage extends StatefulWidget {
  final String weatherType;

  const WeatherTabPage({Key? key, required this.weatherType}) : super(key: key);

  @override
  State<WeatherTabPage> createState() => _WeatherTabPageState();
}

class _WeatherTabPageState extends State<WeatherTabPage> {
  double _currentSliderValue = 1;
  String _lastSuccessfulImageUrl = '';
  String _currentBlurHash = '';
  bool _isFetching = true;

  Future<void> updateImage(String weatherType, int imageId) async {
    final String imageUrl = 'http://localhost:8080/image/$weatherType/$imageId';

    try {
      final http.Response response = await http.get(Uri.parse(imageUrl));

      if (response.statusCode == 200) {
        setState(() {
          _lastSuccessfulImageUrl = imageUrl;
        });
        await updateBlurHash(weatherType, imageId, false);
      } else {
        await updateBlurHash(weatherType, imageId, true);
      }
    } catch (e) {
      print('Error fetching image: $e');
      await updateBlurHash(weatherType, imageId, true);
    }
  }

  Future<void> updateBlurHash(
      String weatherType, int imageId, bool useLastSuccessfulImageUrl) async {
    final String url = useLastSuccessfulImageUrl
        ? _lastSuccessfulImageUrl
        : 'http://localhost:8080/blurhash/$weatherType/$imageId';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _currentBlurHash = data['blurHash'];
            _isFetching = false;
          });
        }
      } else {
        throw Exception('Failed to load blur hash');
      }
    } catch (e) {
      setState(() {
        _isFetching = false;
      });
      print(e);
    }
  }

  @override
  void initState() {
    super.initState();
    updateImage(widget.weatherType, _currentSliderValue.toInt());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Stack(children: [
      AnimatedSwitcher(
        duration: const Duration(seconds: 1), // Adjust cross-fade duration
        child: _isFetching
            ? Container(
                key: ValueKey(_currentSliderValue),
                color: Colors.transparent,
              )
            : BlurHash(
                key: ValueKey(_currentBlurHash),
                hash: _currentBlurHash,
              ),
      ),
      Center(
        child: InteractiveViewer(
          boundaryMargin: const EdgeInsets.all(double.infinity),
          panEnabled: true,
          minScale: 1.0,
          maxScale: 4.0,
          child: Center(
            child: Image.network(
              'http://localhost:8080/image/${widget.weatherType}/${_currentSliderValue.toInt()}',
              errorBuilder: (context, error, stackTrace) {
                return Image.network(_lastSuccessfulImageUrl);
              },
            ),
          ),
        ),
      ),
      Positioned(
        bottom: 50,
        left: 0,
        right: 0,
        child: SfSlider(
          min: 1,
          max: 167,
          value: _currentSliderValue,
          interval: 1,
          showTicks: false,
          showLabels: true,
          enableTooltip: true,
          minorTicksPerInterval: 0,
          dateFormat: DateFormat('EEE h a'),
          dateIntervalType: DateIntervalType.hours,
          labelPlacement: LabelPlacement.onTicks,
          onChanged: (dynamic value) {
            setState(() {
              _currentSliderValue = value;
            });
          },
          onChangeEnd: (dynamic value) {
            setState(() {
              _isFetching = true;
              updateBlurHash(
                  widget.weatherType, _currentSliderValue.toInt(), false);
            });
          },
          labelFormatterCallback: (actualValue, formattedText) {
            DateTime time = DateTime(2024, 3, 28, 7)
                .add(Duration(hours: actualValue.toInt()));

            if (time.hour == 0) {
              return DateFormat('EEE').format(time);
            }
            return '';
          },
          tooltipTextFormatterCallback: (actualValue, formattedText) {
            DateTime time = DateTime(2024, 3, 28, 7)
                .add(Duration(hours: actualValue.toInt()));
            return DateFormat('EEE h a').format(time);
          },
        ),
      ),
    ]));
  }
}
